import { db, run_in_transaction } from '$lib/server/db';
import type { Contact, Interaction } from '$lib/types/db';
import {
	compute_content_hash,
	create_embeddings_batch,
	prepare_contact_text,
	prepare_interaction_text,
} from './embeddings';

interface ContactWithHash extends Contact {
	content_hash: string | null;
}

interface InteractionWithHash extends Interaction {
	contact_name: string;
	content_hash: string | null;
}

/**
 * Update embeddings for all contacts and interactions
 * Uses batch processing and content hashing for optimal performance
 * Only re-embeds records whose content has changed
 *
 * Can be run for:
 * - Specific user (pass user_id)
 * - All users (no user_id) - processes one user at a time to avoid memory issues
 */
export const update_embeddings = async (user_id?: string) => {
	try {
		// If no user_id provided, process all users one-by-one
		if (!user_id) {
			const users = db
				.prepare('SELECT DISTINCT user_id FROM contacts')
				.all() as { user_id: string }[];

			console.log(
				`Processing embeddings for ${users.length} users...`,
			);

			let total_results = {
				message: 'Embeddings updated successfully',
				contacts: { total: 0, changed: 0, embedded: 0, skipped: 0 },
				interactions: {
					total: 0,
					changed: 0,
					embedded: 0,
					skipped: 0,
				},
			};

			for (let i = 0; i < users.length; i++) {
				const { user_id } = users[i];
				console.log(
					`Processing user ${i + 1}/${users.length}: ${user_id}`,
				);

				try {
					const result = await update_embeddings(user_id);

					// Aggregate results
					total_results.contacts.total += result.contacts.total;
					total_results.contacts.changed += result.contacts.changed;
					total_results.contacts.embedded += result.contacts.embedded;
					total_results.contacts.skipped += result.contacts.skipped;
					total_results.interactions.total +=
						result.interactions.total;
					total_results.interactions.changed +=
						result.interactions.changed;
					total_results.interactions.embedded +=
						result.interactions.embedded;
					total_results.interactions.skipped +=
						result.interactions.skipped;
				} catch (error) {
					console.error(`Error processing user ${user_id}:`, error);
					// Continue with next user
				}
			}

			console.log('All users processed:', total_results);
			return total_results;
		}

		// Single user processing
		let contacts: ContactWithHash[];
		let interactions: InteractionWithHash[];

		// Get contacts to process
		contacts = db
			.prepare('SELECT * FROM contacts WHERE user_id = ?')
			.all(user_id) as ContactWithHash[];

		interactions = db
			.prepare(
				`
				SELECT i.*, c.name as contact_name
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
			`,
			)
			.all(user_id) as InteractionWithHash[];

		console.log(
			`Checking ${contacts.length} contacts and ${interactions.length} interactions for changes...`,
		);

		// Filter contacts that need embedding (new or changed content)
		const contacts_to_embed: Array<{
			id: string;
			text: string;
			hash: string;
		}> = [];

		for (const contact of contacts) {
			const text = prepare_contact_text(contact);
			const new_hash = compute_content_hash(text);

			// Only embed if content changed or no hash exists
			if (contact.content_hash !== new_hash) {
				contacts_to_embed.push({
					id: contact.id,
					text,
					hash: new_hash,
				});
			}
		}

		// Filter interactions that need embedding
		const interactions_to_embed: Array<{
			id: string;
			text: string;
			hash: string;
		}> = [];

		for (const interaction of interactions) {
			const text = prepare_interaction_text(interaction);
			const new_hash = compute_content_hash(text);

			// Only embed if content changed or no hash exists
			if (interaction.content_hash !== new_hash) {
				interactions_to_embed.push({
					id: interaction.id,
					text,
					hash: new_hash,
				});
			}
		}

		console.log(
			`Found ${contacts_to_embed.length} contacts and ${interactions_to_embed.length} interactions to embed`,
		);

		let embedded_contacts = 0;
		let embedded_interactions = 0;

		// Batch process contacts
		if (contacts_to_embed.length > 0) {
			console.log(
				`Creating embeddings for ${contacts_to_embed.length} contacts...`,
			);

			const contact_texts = contacts_to_embed.map((c) => c.text);
			const contact_embeddings =
				await create_embeddings_batch(contact_texts);

			// Store embeddings and update content_hash in a transaction (10x faster)
			const delete_stmt = db.prepare(
				'DELETE FROM contact_embeddings WHERE contact_id = ?',
			);
			const insert_embedding_stmt = db.prepare(
				'INSERT INTO contact_embeddings (contact_id, embedding) VALUES (?, ?)',
			);
			const update_hash_stmt = db.prepare(
				'UPDATE contacts SET content_hash = ? WHERE id = ?',
			);

			run_in_transaction(() => {
				for (let i = 0; i < contacts_to_embed.length; i++) {
					const { id, hash } = contacts_to_embed[i];
					const embedding = contact_embeddings[i];

					try {
						// Store embedding (virtual table doesn't support REPLACE)
						delete_stmt.run(id);
						insert_embedding_stmt.run(id, JSON.stringify(embedding));

						// Update content hash
						update_hash_stmt.run(hash, id);
						embedded_contacts++;
					} catch (error) {
						console.error(
							`Error storing embedding for contact ${id}:`,
							error,
						);
					}
				}
			});

			console.log(`Stored ${embedded_contacts} contact embeddings`);
		}

		// Batch process interactions
		if (interactions_to_embed.length > 0) {
			console.log(
				`Creating embeddings for ${interactions_to_embed.length} interactions...`,
			);

			const interaction_texts = interactions_to_embed.map(
				(i) => i.text,
			);
			const interaction_embeddings =
				await create_embeddings_batch(interaction_texts);

			// Store embeddings and update content_hash in a transaction (10x faster)
			const delete_stmt = db.prepare(
				'DELETE FROM interaction_embeddings WHERE interaction_id = ?',
			);
			const insert_embedding_stmt = db.prepare(
				'INSERT INTO interaction_embeddings (interaction_id, embedding) VALUES (?, ?)',
			);
			const update_hash_stmt = db.prepare(
				'UPDATE interactions SET content_hash = ? WHERE id = ?',
			);

			run_in_transaction(() => {
				for (let i = 0; i < interactions_to_embed.length; i++) {
					const { id, hash } = interactions_to_embed[i];
					const embedding = interaction_embeddings[i];

					try {
						// Store embedding (virtual table doesn't support REPLACE)
						delete_stmt.run(id);
						insert_embedding_stmt.run(id, JSON.stringify(embedding));

						// Update content hash
						update_hash_stmt.run(hash, id);
						embedded_interactions++;
					} catch (error) {
						console.error(
							`Error storing embedding for interaction ${id}:`,
							error,
						);
					}
				}
			});

			console.log(
				`Stored ${embedded_interactions} interaction embeddings`,
			);
		}

		const result = {
			message: 'Embeddings updated successfully',
			contacts: {
				total: contacts.length,
				changed: contacts_to_embed.length,
				embedded: embedded_contacts,
				skipped: contacts.length - contacts_to_embed.length,
			},
			interactions: {
				total: interactions.length,
				changed: interactions_to_embed.length,
				embedded: embedded_interactions,
				skipped: interactions.length - interactions_to_embed.length,
			},
		};

		console.log('Embedding update complete:', result);

		return result;
	} catch (error) {
		console.error('Error in update_embeddings:', error);
		throw error;
	}
};
