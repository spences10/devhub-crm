import {
	get_current_user_id,
	guarded_command,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import * as v from 'valibot';
import { get_contacts } from '../(app)/contacts/contacts.remote';

/**
 * Add a scanned profile as a contact
 */
export const add_profile_as_contact = guarded_command(
	v.object({
		username: v.pipe(v.string(), v.minLength(1)),
	}),
	async ({ username }: { username: string }) => {
		const user_id = await get_current_user_id();

		// Get the profile data
		const profile_stmt = db.prepare(`
      SELECT
        up.*,
        u.name,
        u.email,
        u.image
      FROM user_profiles up
      JOIN user u ON up.user_id = u.id
      WHERE up.username = ?
    `);

		const profile = profile_stmt.get(username) as
			| {
					user_id: string;
					username: string;
					github_username: string | null;
					name: string;
					email: string | null;
					image: string | null;
					bio: string | null;
					tagline: string | null;
					website: string | null;
					location: string | null;
			  }
			| undefined;

		if (!profile) {
			return {
				error: 'Profile not found',
			};
		}

		// Check if this contact already exists
		const existing_contact_stmt = db.prepare(`
      SELECT id FROM contacts
      WHERE user_id = ? AND name = ?
    `);

		const existing_contact = existing_contact_stmt.get(
			user_id,
			profile.name,
		) as { id: string } | undefined;

		if (existing_contact) {
			return {
				error: 'This contact already exists in your CRM',
				contact_id: existing_contact.id,
			};
		}

		// Create the contact
		const contact_id = crypto.randomUUID();
		const now = Date.now();

		const insert_stmt = db.prepare(`
      INSERT INTO contacts (
        id, user_id, name, email, phone, company, title,
        github_username, avatar_url, notes,
        last_contacted_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		const notes = [
			profile.bio ? `Bio: ${profile.bio}` : null,
			profile.tagline ? `Tagline: ${profile.tagline}` : null,
			profile.website ? `Website: ${profile.website}` : null,
			profile.location ? `Location: ${profile.location}` : null,
			`DevHub: @${profile.username}`,
		]
			.filter(Boolean)
			.join('\n\n');

		insert_stmt.run(
			contact_id,
			user_id,
			profile.name,
			profile.email || null,
			null,
			null,
			null,
			profile.github_username || null,
			profile.image || null,
			notes,
			null,
			now,
			now,
		);

		// Add social links from the profile
		const social_links_stmt = db.prepare(`
      SELECT platform, url FROM user_social_links
      WHERE user_id = ?
    `);

		const social_links = social_links_stmt.all(
			profile.user_id,
		) as Array<{
			platform: string;
			url: string;
		}>;

		const social_insert_stmt = db.prepare(`
      INSERT INTO social_links (id, contact_id, platform, url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

		for (const link of social_links) {
			social_insert_stmt.run(
				crypto.randomUUID(),
				contact_id,
				link.platform,
				link.url,
				now,
			);
		}

		// Single-flight mutation: refresh contact list
		await get_contacts().refresh();

		return {
			success: true,
			contact_id,
			message: `Added ${profile.name} to your contacts`,
		};
	},
);
