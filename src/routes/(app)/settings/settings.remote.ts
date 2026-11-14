import { query } from '$app/server';
import {
	get_current_user_id,
	guarded_command,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import type { UserPreferences } from '#lib/types/db.ts';
import * as v from 'valibot';

/**
 * Get user preferences, creating default if doesn't exist
 */
export const get_user_preferences = query(
	async (): Promise<UserPreferences> => {
		const user_id = await get_current_user_id();

		// Try to get existing preferences
		const stmt = db.prepare(
			'SELECT * FROM user_preferences WHERE user_id = ?',
		);
		let preferences = stmt.get(user_id) as
			| UserPreferences
			| undefined;

		// If no preferences exist, create default ones
		if (!preferences) {
			const insert_stmt = db.prepare(`
      INSERT INTO user_preferences (
        id, user_id, date_format, time_format,
        default_contact_sort, default_follow_up_days,
        default_interaction_type, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

			const id = crypto.randomUUID();
			const now = Date.now();

			insert_stmt.run(
				id,
				user_id,
				'YYYY-MM-DD',
				'24h',
				'name',
				7,
				null,
				now,
				now,
			);

			preferences = {
				id,
				user_id,
				date_format: 'YYYY-MM-DD',
				time_format: '24h',
				default_contact_sort: 'name',
				default_follow_up_days: 7,
				default_interaction_type: null,
				created_at: now,
				updated_at: now,
			};
		}

		return preferences;
	},
);

/**
 * Update date format preference
 */
export const update_date_format = guarded_command(
	v.union([
		v.literal('YYYY-MM-DD'),
		v.literal('MM/DD/YYYY'),
		v.literal('DD/MM/YYYY'),
	]),
	async (date_format) => {
		const user_id = await get_current_user_id();
		db.prepare(
			'UPDATE user_preferences SET date_format = ?, updated_at = ? WHERE user_id = ?',
		).run(date_format, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update time format preference
 */
export const update_time_format = guarded_command(
	v.union([v.literal('12h'), v.literal('24h')]),
	async (time_format) => {
		const user_id = await get_current_user_id();
		db.prepare(
			'UPDATE user_preferences SET time_format = ?, updated_at = ? WHERE user_id = ?',
		).run(time_format, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update default contact sort preference
 */
export const update_default_contact_sort = guarded_command(
	v.union([
		v.literal('name'),
		v.literal('last_contacted'),
		v.literal('recently_added'),
		v.literal('company'),
	]),
	async (sort) => {
		const user_id = await get_current_user_id();
		db.prepare(
			'UPDATE user_preferences SET default_contact_sort = ?, updated_at = ? WHERE user_id = ?',
		).run(sort, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update default follow-up days preference
 */
export const update_default_follow_up_days = guarded_command(
	v.pipe(v.number(), v.minValue(1), v.maxValue(90)),
	async (days) => {
		const user_id = await get_current_user_id();
		db.prepare(
			'UPDATE user_preferences SET default_follow_up_days = ?, updated_at = ? WHERE user_id = ?',
		).run(days, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update default interaction type preference
 */
export const update_default_interaction_type = guarded_command(
	v.optional(
		v.union([
			v.literal('meeting'),
			v.literal('call'),
			v.literal('email'),
			v.literal('message'),
			v.literal(''),
		]),
	),
	async (type) => {
		const user_id = await get_current_user_id();
		db.prepare(
			'UPDATE user_preferences SET default_interaction_type = ?, updated_at = ? WHERE user_id = ?',
		).run(type || null, Date.now(), user_id);

		return { success: true };
	},
);
