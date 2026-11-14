import { query } from '$app/server';
import {
	get_current_user_id,
	guarded_command,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import type { InteractionType } from '#lib/types/interaction-type.ts';
import * as v from 'valibot';

/**
 * Get all interaction types for the current user
 * Returns system types + user's custom types, sorted by display_order
 */
export const get_interaction_types = query(async () => {
	const user_id = await get_current_user_id();

	const stmt = db.prepare(`
    SELECT id, user_id, value, label, icon, color, display_order, created_at, updated_at
    FROM interaction_types
    WHERE user_id IS NULL OR user_id = ?
    ORDER BY display_order, label
  `);

	return stmt.all(user_id) as Array<InteractionType>;
});

/**
 * Create a new custom interaction type for the current user
 */
const create_interaction_type_schema = v.object({
	value: v.pipe(
		v.string(),
		v.minLength(1),
		v.maxLength(50),
		v.regex(
			/^[a-z0-9_-]+$/,
			'Value must contain only lowercase letters, numbers, underscores, and hyphens',
		),
	),
	label: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	icon: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
	color: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	display_order: v.optional(v.number(), 0),
});

export const create_interaction_type = guarded_command(
	create_interaction_type_schema,
	async (
		data: v.InferOutput<typeof create_interaction_type_schema>,
	) => {
		const user_id = await get_current_user_id();

		// Check if this value already exists for this user
		const existing = db
			.prepare(
				`SELECT id FROM interaction_types WHERE user_id = ? AND value = ?`,
			)
			.get(user_id, data.value);

		if (existing) {
			return {
				error: 'An interaction type with this value already exists',
			};
		}

		const id = crypto.randomUUID();
		const now = Date.now();

		const stmt = db.prepare(`
      INSERT INTO interaction_types (id, user_id, value, label, icon, color, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		try {
			stmt.run(
				id,
				user_id,
				data.value,
				data.label,
				data.icon,
				data.color,
				data.display_order,
				now,
				now,
			);

			return { success: true, id };
		} catch {
			return {
				error: 'Failed to create interaction type',
			};
		}
	},
);

/**
 * Update an existing custom interaction type
 * Cannot update system types (user_id = NULL)
 */
const update_interaction_type_schema = v.object({
	id: v.pipe(v.string(), v.minLength(1)),
	label: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	icon: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
	color: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	display_order: v.optional(v.number(), 0),
});

export const update_interaction_type = guarded_command(
	update_interaction_type_schema,
	async (
		data: v.InferOutput<typeof update_interaction_type_schema>,
	) => {
		const user_id = await get_current_user_id();

		// Fetch the interaction type to verify it belongs to the user
		const type_check = db
			.prepare(
				`SELECT id, user_id FROM interaction_types WHERE id = ?`,
			)
			.get(data.id) as
			| { id: string; user_id: string | null }
			| undefined;

		if (!type_check) {
			return { error: 'Interaction type not found' };
		}

		// Prevent editing system types (user_id = NULL)
		if (type_check.user_id === null) {
			return { error: 'Cannot edit system interaction types' };
		}

		// Verify it belongs to the current user
		if (type_check.user_id !== user_id) {
			return {
				error: 'You do not have permission to edit this type',
			};
		}

		const stmt = db.prepare(`
      UPDATE interaction_types
      SET label = ?, icon = ?, color = ?, display_order = ?, updated_at = ?
      WHERE id = ?
    `);

		try {
			stmt.run(
				data.label,
				data.icon,
				data.color,
				data.display_order,
				Date.now(),
				data.id,
			);

			return { success: true };
		} catch {
			return { error: 'Failed to update interaction type' };
		}
	},
);

/**
 * Delete a custom interaction type
 * Cannot delete system types (user_id = NULL)
 * Cannot delete types that are in use
 */
export const delete_interaction_type = guarded_command(
	v.pipe(v.string(), v.minLength(1)),
	async (id) => {
		const user_id = await get_current_user_id();

		// Fetch the interaction type to verify it belongs to the user
		const type_check = db
			.prepare(
				`SELECT id, user_id, value FROM interaction_types WHERE id = ?`,
			)
			.get(id) as
			| { id: string; user_id: string | null; value: string }
			| undefined;

		if (!type_check) {
			return { error: 'Interaction type not found' };
		}

		// Prevent deleting system types (user_id = NULL)
		if (type_check.user_id === null) {
			return { error: 'Cannot delete system interaction types' };
		}

		// Verify it belongs to the current user
		if (type_check.user_id !== user_id) {
			return {
				error: 'You do not have permission to delete this type',
			};
		}

		// Check if this type is in use
		const in_use = db
			.prepare(
				`SELECT COUNT(*) as count FROM interactions i
         INNER JOIN contacts c ON i.contact_id = c.id
         WHERE i.type = ? AND c.user_id = ?`,
			)
			.get(type_check.value, user_id) as { count: number };

		if (in_use.count > 0) {
			return {
				error: `Cannot delete this type as it is used in ${in_use.count} interaction(s)`,
			};
		}

		const stmt = db.prepare(
			`DELETE FROM interaction_types WHERE id = ?`,
		);

		try {
			stmt.run(id);
			return { success: true };
		} catch {
			return { error: 'Failed to delete interaction type' };
		}
	},
);
