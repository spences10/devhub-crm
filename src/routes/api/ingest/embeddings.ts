import * as env from '$app/env/private';
import { db } from '#lib/server/db.ts';
import type { Contact, Interaction } from '#lib/types/db.ts';
import { createHash } from 'node:crypto';

const VOYAGE_API_KEY = env.VOYAGE_API_KEY;

/**
 * Compute SHA256 hash of text content for change detection
 * @param text - Text to hash
 * @returns Hex-encoded SHA256 hash
 */
export const compute_content_hash = (text: string): string => {
	return createHash('sha256').update(text).digest('hex');
};

/**
 * Create embedding vector(s) from text using Voyage AI
 * Supports both single text and batch processing (up to 128 texts)
 * @param text - Single text string or array of texts to embed
 * @returns Single embedding vector or array of embedding vectors
 */
const create_embedding = async (
	text: string | string[],
): Promise<number[] | number[][]> => {
	if (!VOYAGE_API_KEY) {
		throw new Error('VOYAGE_API_KEY not configured');
	}

	const is_batch = Array.isArray(text);
	const batch_size = is_batch ? text.length : 1;

	if (is_batch && batch_size > 128) {
		throw new Error(
			`Batch size ${batch_size} exceeds maximum of 128 texts`,
		);
	}

	try {
		const response = await fetch(
			'https://api.voyageai.com/v1/embeddings',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${VOYAGE_API_KEY}`,
				},
				body: JSON.stringify({
					model: 'voyage-3',
					input: text,
					input_type: 'document',
				}),
			},
		);

		if (!response.ok) {
			const error_body = await response.text();
			throw new Error(
				`Voyage AI API error! status: ${response.status}, body: ${error_body}`,
			);
		}

		const data = await response.json();
		if (!data.data || !Array.isArray(data.data)) {
			throw new Error('Unexpected Voyage AI response format');
		}

		// Extract embeddings from response
		const embeddings = data.data.map((item: any) => {
			if (!item.embedding || !Array.isArray(item.embedding)) {
				throw new Error('Invalid embedding in response');
			}
			if (item.embedding.length !== 1024) {
				throw new Error(
					`Expected 1024 dimensions, got ${item.embedding.length}`,
				);
			}
			return item.embedding;
		});

		// Return single embedding or array based on input type
		return is_batch ? embeddings : embeddings[0];
	} catch (error) {
		console.error('Error creating embedding:', error);
		throw error;
	}
};

/**
 * Batch create embeddings for multiple texts
 * Automatically chunks into batches of 128 (Voyage AI limit)
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors in same order as input
 */
export const create_embeddings_batch = async (
	texts: string[],
): Promise<number[][]> => {
	if (texts.length === 0) {
		return [];
	}

	const BATCH_SIZE = 128;
	const all_embeddings: number[][] = [];

	// Process in chunks of 128
	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);
		const embeddings = (await create_embedding(batch)) as number[][];
		all_embeddings.push(...embeddings);

		console.log(
			`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} items)`,
		);
	}

	return all_embeddings;
};

/**
 * Prepare contact text for embedding
 * Combines name, company, title, and notes into searchable text
 */
export const prepare_contact_text = (contact: Contact): string => {
	const parts = [contact.name];

	if (contact.company) parts.push(contact.company);
	if (contact.title) parts.push(contact.title);
	if (contact.github_username) parts.push(contact.github_username);
	if (contact.notes) parts.push(contact.notes);

	return parts.filter(Boolean).join(' | ');
};

/**
 * Prepare interaction text for embedding
 * Combines type, contact name, and note into searchable text
 */
export const prepare_interaction_text = (
	interaction: Interaction & { contact_name: string },
): string => {
	const parts = [
		`Type: ${interaction.type}`,
		`Contact: ${interaction.contact_name}`,
	];

	if (interaction.note) parts.push(interaction.note);

	return parts.filter(Boolean).join(' | ');
};

/**
 * Store contact embedding in database
 * @param contact_id - Contact ID
 * @param content - Prepared contact text
 */
export const store_contact_embedding = async (
	contact_id: string,
	content: string,
) => {
	try {
		const embedding = await create_embedding(content);

		if (embedding.length !== 1024) {
			throw new Error(
				`Expected 1024 dimensions, but got ${embedding.length}`,
			);
		}

		// Store as JSON string (sqlite-vec handles conversion)
		const embedding_json = JSON.stringify(embedding);

		// Virtual tables don't support INSERT OR REPLACE, so DELETE first
		const delete_stmt = db.prepare(`
			DELETE FROM contact_embeddings WHERE contact_id = ?
		`);
		delete_stmt.run(contact_id);

		const insert_stmt = db.prepare(`
			INSERT INTO contact_embeddings (contact_id, embedding)
			VALUES (?, ?)
		`);
		insert_stmt.run(contact_id, embedding_json);
	} catch (error) {
		console.error(
			`Error storing embedding for contact ${contact_id}:`,
			error,
		);
		throw error;
	}
};

/**
 * Store interaction embedding in database
 * @param interaction_id - Interaction ID
 * @param content - Prepared interaction text
 */
export const store_interaction_embedding = async (
	interaction_id: string,
	content: string,
) => {
	try {
		const embedding = await create_embedding(content);

		if (embedding.length !== 1024) {
			throw new Error(
				`Expected 1024 dimensions, but got ${embedding.length}`,
			);
		}

		// Store as JSON string (sqlite-vec handles conversion)
		const embedding_json = JSON.stringify(embedding);

		// Virtual tables don't support INSERT OR REPLACE, so DELETE first
		const delete_stmt = db.prepare(`
			DELETE FROM interaction_embeddings WHERE interaction_id = ?
		`);
		delete_stmt.run(interaction_id);

		const insert_stmt = db.prepare(`
			INSERT INTO interaction_embeddings (interaction_id, embedding)
			VALUES (?, ?)
		`);
		insert_stmt.run(interaction_id, embedding_json);
	} catch (error) {
		console.error(
			`Error storing embedding for interaction ${interaction_id}:`,
			error,
		);
		throw error;
	}
};

/**
 * Check if contact embedding exists
 */
export const get_contact_embedding = async (
	contact_id: string,
): Promise<number[] | null> => {
	try {
		const stmt = db.prepare(`
			SELECT embedding FROM contact_embeddings WHERE contact_id = ?
		`);
		const result = stmt.get(contact_id) as
			| { embedding: string }
			| undefined;

		if (result && result.embedding) {
			// Parse JSON string back to array
			return JSON.parse(result.embedding);
		}

		return null;
	} catch (error) {
		console.error('Error getting contact embedding:', error);
		return null;
	}
};

/**
 * Check if interaction embedding exists
 */
export const get_interaction_embedding = async (
	interaction_id: string,
): Promise<number[] | null> => {
	try {
		const stmt = db.prepare(`
			SELECT embedding FROM interaction_embeddings WHERE interaction_id = ?
		`);
		const result = stmt.get(interaction_id) as
			| { embedding: string }
			| undefined;

		if (result && result.embedding) {
			// Parse JSON string back to array
			return JSON.parse(result.embedding);
		}

		return null;
	} catch (error) {
		console.error('Error getting interaction embedding:', error);
		return null;
	}
};

/**
 * Find similar contacts using vector similarity
 * @param contact_id - Reference contact ID
 * @param limit - Maximum number of results
 * @returns Array of similar contact IDs with similarity scores
 */
export const get_similar_contacts = async (
	contact_id: string,
	limit: number = 10,
): Promise<Array<{ contact_id: string; distance: number }>> => {
	try {
		// Try KNN syntax first (faster)
		const stmt = db.prepare(`
			SELECT contact_id, distance
			FROM contact_embeddings
			WHERE embedding MATCH (
				SELECT embedding FROM contact_embeddings WHERE contact_id = ?
			)
			AND k = ?
			AND contact_id != ?
		`);

		const results = stmt.all(contact_id, limit, contact_id) as Array<{
			contact_id: string;
			distance: number;
		}>;

		return results;
	} catch (error) {
		console.error('Error getting similar contacts (KNN):', error);

		// Fallback to distance calculation
		try {
			const stmt = db.prepare(`
				SELECT contact_id,
					vec_distance_cosine(
						embedding,
						(SELECT embedding FROM contact_embeddings WHERE contact_id = ?)
					) as distance
				FROM contact_embeddings
				WHERE contact_id != ?
				ORDER BY distance ASC
				LIMIT ?
			`);

			const results = stmt.all(
				contact_id,
				contact_id,
				limit,
			) as Array<{
				contact_id: string;
				distance: number;
			}>;

			return results;
		} catch (fallback_error) {
			console.error('Fallback query also failed:', fallback_error);
			throw error;
		}
	}
};

/**
 * Find similar interactions using vector similarity
 * @param interaction_id - Reference interaction ID
 * @param limit - Maximum number of results
 * @returns Array of similar interaction IDs with similarity scores
 */
export const get_similar_interactions = async (
	interaction_id: string,
	limit: number = 10,
): Promise<Array<{ interaction_id: string; distance: number }>> => {
	try {
		// Try KNN syntax first (faster)
		const stmt = db.prepare(`
			SELECT interaction_id, distance
			FROM interaction_embeddings
			WHERE embedding MATCH (
				SELECT embedding FROM interaction_embeddings WHERE interaction_id = ?
			)
			AND k = ?
			AND interaction_id != ?
		`);

		const results = stmt.all(
			interaction_id,
			limit,
			interaction_id,
		) as Array<{
			interaction_id: string;
			distance: number;
		}>;

		return results;
	} catch (error) {
		console.error('Error getting similar interactions (KNN):', error);

		// Fallback to distance calculation
		try {
			const stmt = db.prepare(`
				SELECT interaction_id,
					vec_distance_cosine(
						embedding,
						(SELECT embedding FROM interaction_embeddings WHERE interaction_id = ?)
					) as distance
				FROM interaction_embeddings
				WHERE interaction_id != ?
				ORDER BY distance ASC
				LIMIT ?
			`);

			const results = stmt.all(
				interaction_id,
				interaction_id,
				limit,
			) as Array<{
				interaction_id: string;
				distance: number;
			}>;

			return results;
		} catch (fallback_error) {
			console.error('Fallback query also failed:', fallback_error);
			throw error;
		}
	}
};

/**
 * Get interactions for a specific contact, ordered by relevance
 * @param contact_id - Contact ID
 * @param limit - Maximum number of results
 * @returns Array of interaction IDs with similarity scores
 */
export const get_contact_interaction_topics = async (
	contact_id: string,
	limit: number = 5,
): Promise<Array<{ interaction_id: string; note: string }>> => {
	try {
		const stmt = db.prepare(`
			SELECT i.id as interaction_id, i.note
			FROM interactions i
			WHERE i.contact_id = ?
			AND i.note IS NOT NULL
			AND i.note != ''
			ORDER BY i.created_at DESC
			LIMIT ?
		`);

		const results = stmt.all(contact_id, limit) as Array<{
			interaction_id: string;
			note: string;
		}>;

		return results;
	} catch (error) {
		console.error('Error getting contact interaction topics:', error);
		return [];
	}
};
