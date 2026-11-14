import { query } from '$app/server';
import {
	get_current_user_id,
	guarded_command,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import type { Contact, Tag } from '#lib/types/db.ts';
import * as v from 'valibot';

/**
 * Get all tags for the current user with usage counts
 */
export const get_tags = query(
	async (): Promise<Array<Tag & { contact_count: number }>> => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(`
    SELECT
      t.*,
      COUNT(ct.id) as contact_count
    FROM tags t
    LEFT JOIN contact_tags ct ON t.id = ct.tag_id
    WHERE t.user_id = ?
    GROUP BY t.id
    ORDER BY t.name ASC
  `);

		return stmt.all(user_id) as Array<
			Tag & { contact_count: number }
		>;
	},
);

/**
 * Get tags for a specific contact
 */
export const get_contact_tags = query.batch(
	v.pipe(v.string(), v.minLength(1)),
	async (contact_ids) => {
		const user_id = await get_current_user_id();

		// Verify contacts belong to user
		const placeholders = contact_ids.map(() => '?').join(',');
		const verify_stmt = db.prepare(`
      SELECT id FROM contacts
      WHERE id IN (${placeholders}) AND user_id = ?
    `);
		const valid_contacts = verify_stmt.all(
			...contact_ids,
			user_id,
		) as Array<{ id: string }>;
		const valid_ids = new Set(valid_contacts.map((c) => c.id));

		// Get tags for all valid contacts
		const tags_stmt = db.prepare(`
      SELECT t.*, ct.contact_id
      FROM tags t
      INNER JOIN contact_tags ct ON t.id = ct.tag_id
      WHERE ct.contact_id IN (${placeholders})
      ORDER BY t.name ASC
    `);
		const all_tags = tags_stmt.all(...contact_ids) as Array<
			Tag & { contact_id: string }
		>;

		// Return lookup function
		return (contact_id) => {
			if (!valid_ids.has(contact_id)) {
				return [];
			}
			return all_tags.filter((t) => t.contact_id === contact_id);
		};
	},
);

/**
 * Create a new tag
 */
export const create_tag = guarded_command(
	v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Tag name is required')),
		color: v.pipe(
			v.string(),
			v.regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
		),
	}),
	async (data: { name: string; color: string }) => {
		const user_id = await get_current_user_id();

		// Check if tag with same name already exists for this user
		const exists = db
			.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
			.get(user_id, data.name);

		if (exists) {
			throw new Error('A tag with this name already exists');
		}

		const id = crypto.randomUUID();
		const now = Date.now();

		const stmt = db.prepare(`
      INSERT INTO tags (id, user_id, name, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

		stmt.run(id, user_id, data.name, data.color, now, now);

		// Single-flight mutation: refresh tag list
		await get_tags().refresh();

		return { success: true, id };
	},
);

/**
 * Update an existing tag
 */
export const update_tag = guarded_command(
	v.object({
		id: v.pipe(v.string(), v.minLength(1)),
		name: v.pipe(v.string(), v.minLength(1, 'Tag name is required')),
		color: v.pipe(
			v.string(),
			v.regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
		),
	}),
	async (data: { id: string; name: string; color: string }) => {
		const user_id = await get_current_user_id();

		// Check if another tag with same name exists
		const exists = db
			.prepare(
				'SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?',
			)
			.get(user_id, data.name, data.id);

		if (exists) {
			throw new Error('A tag with this name already exists');
		}

		const stmt = db.prepare(`
      UPDATE tags
      SET name = ?, color = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

		const result = stmt.run(
			data.name,
			data.color,
			Date.now(),
			data.id,
			user_id,
		);

		if (result.changes === 0) {
			throw new Error('Tag not found');
		}

		// Single-flight mutation: refresh tag list
		await get_tags().refresh();

		return { success: true };
	},
);

/**
 * Delete a tag (cascades to contact_tags)
 */
export const delete_tag = guarded_command(
	v.pipe(v.string(), v.minLength(1)),
	async (id: string) => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(
			'DELETE FROM tags WHERE id = ? AND user_id = ?',
		);
		const result = stmt.run(id, user_id);

		if (result.changes === 0) {
			return { error: 'Tag not found' };
		}

		// Single-flight mutation: refresh tag list
		await get_tags().refresh();

		return { success: true };
	},
);

/**
 * Add a tag to a contact
 */
export const add_tag_to_contact = guarded_command(
	v.object({
		contact_id: v.pipe(v.string(), v.minLength(1)),
		tag_id: v.pipe(v.string(), v.minLength(1)),
	}),
	async (data: { contact_id: string; tag_id: string }) => {
		const user_id = await get_current_user_id();

		// Verify contact belongs to user
		const contact = db
			.prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?')
			.get(data.contact_id, user_id);

		if (!contact) {
			throw new Error('Contact not found');
		}

		// Verify tag belongs to user
		const tag = db
			.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?')
			.get(data.tag_id, user_id);

		if (!tag) {
			throw new Error('Tag not found');
		}

		// Check if already tagged
		const exists = db
			.prepare(
				'SELECT id FROM contact_tags WHERE contact_id = ? AND tag_id = ?',
			)
			.get(data.contact_id, data.tag_id);

		if (exists) {
			return { success: true, message: 'Tag already assigned' };
		}

		// Add tag to contact
		const id = crypto.randomUUID();
		const now = Date.now();

		const stmt = db.prepare(`
      INSERT INTO contact_tags (id, contact_id, tag_id, created_at)
      VALUES (?, ?, ?, ?)
    `);

		stmt.run(id, data.contact_id, data.tag_id, now);

		// Single-flight mutation: refresh related queries
		await get_contact_tags(data.contact_id).refresh();
		await get_tag_contacts(data.tag_id).refresh();
		await get_tags().refresh();

		return { success: true };
	},
);

/**
 * Remove a tag from a contact
 */
export const remove_tag_from_contact = guarded_command(
	v.object({
		contact_id: v.pipe(v.string(), v.minLength(1)),
		tag_id: v.pipe(v.string(), v.minLength(1)),
	}),
	async (data: { contact_id: string; tag_id: string }) => {
		const user_id = await get_current_user_id();

		// Verify contact belongs to user
		const contact = db
			.prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?')
			.get(data.contact_id, user_id);

		if (!contact) {
			throw new Error('Contact not found');
		}

		const stmt = db.prepare(`
      DELETE FROM contact_tags
      WHERE contact_id = ? AND tag_id = ?
    `);

		const result = stmt.run(data.contact_id, data.tag_id);

		if (result.changes === 0) {
			return { error: 'Tag assignment not found' };
		}

		// Single-flight mutation: refresh related queries
		await get_contact_tags(data.contact_id).refresh();
		await get_tag_contacts(data.tag_id).refresh();
		await get_tags().refresh();

		return { success: true };
	},
);

/**
 * Get contacts for a specific tag
 */
export const get_tag_contacts = query.batch(
	v.pipe(v.string(), v.minLength(1)),
	async (tag_ids) => {
		const user_id = await get_current_user_id();

		// Verify tags belong to user
		const placeholders = tag_ids.map(() => '?').join(',');
		const verify_stmt = db.prepare(`
      SELECT id FROM tags
      WHERE id IN (${placeholders}) AND user_id = ?
    `);
		const valid_tags = verify_stmt.all(...tag_ids, user_id) as Array<{
			id: string;
		}>;
		const valid_ids = new Set(valid_tags.map((t) => t.id));

		// Get contacts for all valid tags
		const contacts_stmt = db.prepare(`
      SELECT c.*, ct.tag_id
      FROM contacts c
      INNER JOIN contact_tags ct ON c.id = ct.contact_id
      WHERE ct.tag_id IN (${placeholders}) AND c.user_id = ?
      ORDER BY c.name ASC
    `);
		const all_contacts = contacts_stmt.all(
			...tag_ids,
			user_id,
		) as Array<Contact & { tag_id: string }>;

		// Return lookup function
		return (tag_id) => {
			if (!valid_ids.has(tag_id)) {
				return [];
			}
			return all_contacts.filter((c) => c.tag_id === tag_id);
		};
	},
);
