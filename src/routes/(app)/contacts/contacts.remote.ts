import { query } from '$app/server';
import {
	get_current_user_id,
	guarded_command,
	guarded_form,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import { fetch_github_contact } from '#lib/server/github.ts';
import type { Contact, SocialLink, Tag } from '#lib/types/db.ts';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

/**
 * Get all contacts for the current user with their tags
 */
export const get_contacts = query(async (): Promise<Contact[]> => {
	const user_id = await get_current_user_id();

	// First, get all contacts
	const contacts_stmt = db.prepare(`
    SELECT * FROM contacts
    WHERE user_id = ?
    ORDER BY name ASC
  `);
	const contacts = contacts_stmt.all(user_id) as Contact[];

	// If no contacts, return empty array
	if (contacts.length === 0) {
		return [];
	}

	// Get all tags for these contacts
	const contact_ids = contacts.map((c) => c.id);
	const placeholders = contact_ids.map(() => '?').join(',');

	const tags_stmt = db.prepare(`
    SELECT t.*, ct.contact_id
    FROM tags t
    INNER JOIN contact_tags ct ON t.id = ct.tag_id
    WHERE ct.contact_id IN (${placeholders})
    ORDER BY t.name ASC
  `);

	const tags_result = tags_stmt.all(...contact_ids) as Array<
		Tag & { contact_id: string }
	>;

	// Group tags by contact_id
	const tags_by_contact = new Map<string, Contact['tags']>();
	for (const tag of tags_result) {
		const contact_id = tag.contact_id;
		if (!tags_by_contact.has(contact_id)) {
			tags_by_contact.set(contact_id, []);
		}
		// Remove contact_id from tag object before adding
		const { contact_id: _, ...tag_without_contact_id } = tag;
		tags_by_contact.get(contact_id)!.push(tag_without_contact_id);
	}

	// Attach tags to contacts
	return contacts.map((contact) => ({
		...contact,
		tags: tags_by_contact.get(contact.id) || [],
	}));
});

/**
 * Get a single contact with additional stats
 */
export const get_contact = query.batch(
	v.pipe(v.string(), v.minLength(1)),
	async (ids) => {
		const user_id = await get_current_user_id();

		// Fetch all requested contacts in one go
		const placeholders = ids.map(() => '?').join(',');
		const contact_stmt = db.prepare(`
      SELECT * FROM contacts
      WHERE id IN (${placeholders}) AND user_id = ?
    `);
		const contacts = contact_stmt.all(...ids, user_id) as Contact[];

		// Get stats for all contacts
		const stats_stmt = db.prepare(`
      SELECT
        contact_id,
        COUNT(*) as interaction_count,
        MAX(created_at) as last_interaction_at
      FROM interactions
      WHERE contact_id IN (${placeholders})
      GROUP BY contact_id
    `);
		const stats = stats_stmt.all(...ids) as Array<{
			contact_id: string;
			interaction_count: number;
			last_interaction_at: number | null;
		}>;

		// Get follow-ups for all contacts
		const follow_ups_stmt = db.prepare(`
      SELECT contact_id, COUNT(*) as pending_follow_ups
      FROM follow_ups
      WHERE contact_id IN (${placeholders}) AND completed = 0
      GROUP BY contact_id
    `);
		const follow_ups = follow_ups_stmt.all(...ids) as Array<{
			contact_id: string;
			pending_follow_ups: number;
		}>;

		// Get social links for all contacts
		const social_links_stmt = db.prepare(`
      SELECT * FROM social_links
      WHERE contact_id IN (${placeholders})
      ORDER BY created_at ASC
    `);
		const all_social_links = social_links_stmt.all(
			...ids,
		) as SocialLink[];

		// Return lookup function
		return (id) => {
			const contact = contacts.find((c) => c.id === id);
			if (!contact) {
				redirect(404, '/contacts');
			}

			const contact_stats = stats.find((s) => s.contact_id === id);
			const contact_follow_ups = follow_ups.find(
				(f) => f.contact_id === id,
			);
			const contact_social_links = all_social_links.filter(
				(s) => s.contact_id === id,
			);

			return {
				...contact,
				interaction_count: contact_stats?.interaction_count || 0,
				last_interaction_at:
					contact_stats?.last_interaction_at || null,
				pending_follow_ups:
					contact_follow_ups?.pending_follow_ups || 0,
				social_links: contact_social_links,
			};
		};
	},
);

/**
 * Create a new contact
 */
export const create_contact = guarded_form(
	v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
		email: v.optional(
			v.union([
				v.pipe(
					v.literal(''),
					v.transform(() => undefined),
				),
				v.pipe(v.string(), v.email('Invalid email')),
			]),
		),
		phone: v.optional(v.string()),
		company: v.optional(v.string()),
		title: v.optional(v.string()),
		github_username: v.optional(v.string()),
		avatar_url: v.optional(v.string()),
		is_vip: v.optional(v.boolean()),
		birthday: v.optional(v.string()), // YYYY-MM-DD format
		in_network_since: v.optional(v.string()), // Date input - will be converted to timestamp
		notes: v.optional(v.string()),
		social_links: v.optional(v.string()), // JSON stringified array
	}),
	async (data) => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(`
      INSERT INTO contacts (
        id, user_id, name, email, phone, company, title,
        github_username, avatar_url, is_vip, birthday, in_network_since, notes,
        last_contacted_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		const id = crypto.randomUUID();
		const now = Date.now();

		// Convert date string to timestamp if provided, otherwise default to current time
		const in_network_since = data.in_network_since
			? new Date(data.in_network_since).getTime()
			: now;

		stmt.run(
			id,
			user_id,
			data.name,
			data.email || null,
			data.phone || null,
			data.company || null,
			data.title || null,
			data.github_username || null,
			data.avatar_url || null,
			data.is_vip ? 1 : 0,
			data.birthday || null,
			in_network_since,
			data.notes || null,
			null, // last_contacted_at
			now,
			now,
		);

		// Save social links if provided
		if (data.social_links) {
			try {
				const social_links = JSON.parse(data.social_links) as Array<{
					platform: string;
					url: string;
				}>;

				const social_stmt = db.prepare(`
          INSERT INTO social_links (id, contact_id, platform, url, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);

				for (const link of social_links) {
					social_stmt.run(
						crypto.randomUUID(),
						id,
						link.platform,
						link.url,
						now,
					);
				}
			} catch (e) {
				console.error('Failed to parse social_links JSON:', e);
				throw new Error(
					'Invalid social links format. Please check your input.',
				);
			}
		}

		redirect(303, `/contacts/${id}`);
	},
);

const update_contact_schema = v.object({
	id: v.pipe(v.string(), v.minLength(1)),
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	email: v.optional(
		v.union([
			v.pipe(
				v.literal(''),
				v.transform(() => undefined),
			),
			v.pipe(v.string(), v.email('Invalid email')),
		]),
	),
	phone: v.optional(v.string()),
	company: v.optional(v.string()),
	title: v.optional(v.string()),
	github_username: v.optional(v.string()),
	avatar_url: v.optional(v.string()),
	is_vip: v.optional(v.boolean()),
	birthday: v.optional(v.string()),
	in_network_since: v.optional(v.string()), // Date input - will be converted to timestamp
	notes: v.optional(v.string()),
});

/**
 * Update an existing contact
 */
export const update_contact = guarded_command(
	update_contact_schema,
	async (data: v.InferOutput<typeof update_contact_schema>) => {
		const user_id = await get_current_user_id();

		// Convert date string to timestamp if provided
		const in_network_since = data.in_network_since
			? new Date(data.in_network_since).getTime()
			: undefined;

		const stmt = db.prepare(`
      UPDATE contacts
      SET
        name = ?,
        email = ?,
        phone = ?,
        company = ?,
        title = ?,
        github_username = ?,
        avatar_url = ?,
        is_vip = ?,
        birthday = ?,
        in_network_since = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

		stmt.run(
			data.name,
			data.email || null,
			data.phone || null,
			data.company || null,
			data.title || null,
			data.github_username || null,
			data.avatar_url || null,
			data.is_vip ? 1 : 0,
			data.birthday || null,
			in_network_since !== undefined ? in_network_since : null,
			data.notes || null,
			Date.now(),
			data.id,
			user_id,
		);

		// Single-flight mutation: refresh related queries
		await get_contact(data.id).refresh();
		await get_contacts().refresh();

		return { success: true };
	},
);

/**
 * Delete a contact
 */
export const delete_contact = guarded_command(
	v.pipe(v.string(), v.minLength(1)),
	async (id) => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(`
      DELETE FROM contacts
      WHERE id = ? AND user_id = ?
    `);

		const result = stmt.run(id, user_id);

		if (result.changes === 0) {
			return { error: 'Contact not found' };
		}

		// Single-flight mutation: refresh contact list
		await get_contacts().refresh();

		return { success: true };
	},
);

/**
 * Get VIP contacts for the current user
 */
export const get_vip_contacts = query(
	async (): Promise<Contact[]> => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(`
    SELECT * FROM contacts
    WHERE user_id = ? AND is_vip = 1
    ORDER BY name ASC
  `);

		return stmt.all(user_id) as Contact[];
	},
);

/**
 * Get recently added contacts (last 7 days)
 */
export const get_recent_contacts = query(
	v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
		5,
	),
	async (limit): Promise<Contact[]> => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(`
    SELECT * FROM contacts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

		return stmt.all(user_id, limit) as Contact[];
	},
);

/**
 * Get contacts with upcoming birthdays (within next 30 days)
 */
export const get_upcoming_birthdays = query(
	async (): Promise<Contact[]> => {
		const user_id = await get_current_user_id();

		// This is a simplified version - would need more complex logic for cross-year birthdays
		const stmt = db.prepare(`
    SELECT * FROM contacts
    WHERE user_id = ? AND birthday IS NOT NULL
    ORDER BY birthday ASC
  `);

		return stmt.all(user_id) as Contact[];
	},
);

/**
 * Fetch contact data from GitHub username
 */
export const fetch_github_data = guarded_command(
	v.pipe(v.string(), v.minLength(1, 'GitHub username is required')),
	async (username: string) => {
		const contact_data = await fetch_github_contact(username);

		if (!contact_data) {
			return {
				error: 'GitHub user not found',
			};
		}

		return {
			success: true,
			data: contact_data,
		};
	},
);

/**
 * Get social links for a specific contact
 */
export const get_social_links = query.batch(
	v.pipe(v.string(), v.minLength(1)),
	async (contact_ids) => {
		const user_id = await get_current_user_id();

		// Verify the contacts belong to the current user
		const placeholders = contact_ids.map(() => '?').join(',');
		const contact_check = db.prepare(`
      SELECT id FROM contacts
      WHERE id IN (${placeholders}) AND user_id = ?
    `);
		const valid_contacts = contact_check.all(
			...contact_ids,
			user_id,
		) as Array<{ id: string }>;
		const valid_ids = new Set(valid_contacts.map((c) => c.id));

		// Fetch all social links for valid contacts
		const stmt = db.prepare(`
      SELECT * FROM social_links
      WHERE contact_id IN (${placeholders})
      ORDER BY created_at ASC
    `);
		const all_social_links = stmt.all(...contact_ids) as SocialLink[];

		// Return lookup function
		return (contact_id) => {
			if (!valid_ids.has(contact_id)) {
				return [];
			}
			return all_social_links.filter(
				(s) => s.contact_id === contact_id,
			);
		};
	},
);

/**
 * Add a social link to a contact
 */
export const add_social_link = guarded_command(
	v.object({
		contact_id: v.pipe(v.string(), v.minLength(1)),
		platform: v.pipe(v.string(), v.minLength(1)),
		url: v.pipe(v.string(), v.url()),
	}),
	async (data: {
		contact_id: string;
		platform: string;
		url: string;
	}) => {
		const user_id = await get_current_user_id();

		// Verify contact belongs to user
		const contact_check = db.prepare(
			'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
		);
		const contact = contact_check.get(data.contact_id, user_id);

		if (!contact) {
			throw new Error('Contact not found');
		}

		// Insert social link
		const id = crypto.randomUUID();
		const now = Date.now();

		const stmt = db.prepare(`
      INSERT INTO social_links (id, contact_id, platform, url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

		stmt.run(id, data.contact_id, data.platform, data.url, now);

		// Single-flight mutation: refresh contact and social links
		await get_contact(data.contact_id).refresh();
		await get_social_links(data.contact_id).refresh();

		return { success: true, id };
	},
);

/**
 * Delete a social link
 */
export const delete_social_link = guarded_command(
	v.pipe(v.string(), v.minLength(1)),
	async (id: string) => {
		const user_id = await get_current_user_id();

		// Verify the social link belongs to a contact owned by the user
		const check_stmt = db.prepare(`
      SELECT sl.id, sl.contact_id FROM social_links sl
      INNER JOIN contacts c ON sl.contact_id = c.id
      WHERE sl.id = ? AND c.user_id = ?
    `);
		const social_link = check_stmt.get(id, user_id) as
			| { id: string; contact_id: string }
			| undefined;

		if (!social_link) {
			throw new Error('Social link not found');
		}

		const stmt = db.prepare('DELETE FROM social_links WHERE id = ?');
		stmt.run(id);

		// Single-flight mutation: refresh contact and social links
		await get_contact(social_link.contact_id).refresh();
		await get_social_links(social_link.contact_id).refresh();

		return { success: true };
	},
);
