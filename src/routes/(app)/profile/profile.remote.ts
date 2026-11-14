import { getRequestEvent, query } from '$app/server';
import * as env from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import {
	get_current_user_id,
	guarded_command,
	guarded_form,
} from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import * as v from 'valibot';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';

/**
 * Check if the current user is the demo account
 */
const is_demo_account = async (): Promise<boolean> => {
	const user_id = await get_current_user_id();
	const user = db
		.prepare('SELECT email FROM user WHERE id = ?')
		.get(user_id) as { email: string } | undefined;

	return user?.email === DEMO_USER_EMAIL;
};

interface UserProfile {
	id: string;
	name: string;
	email: string;
	image: string | null;
	username: string;
	github_username: string | null;
	bio: string | null;
	tagline: string | null;
	location: string | null;
	website: string | null;
	visibility: string;
	qr_code_url: string | null;
}

interface UserSocialLink {
	id: string;
	platform: string;
	url: string;
}

/**
 * Get current user's complete profile
 */
export const get_user_profile = query(
	async (): Promise<UserProfile> => {
		const user_id = await get_current_user_id();

		// Get user basic info from Better Auth
		const user_stmt = db.prepare(
			'SELECT id, name, email, image FROM user WHERE id = ?',
		);
		const user = user_stmt.get(user_id) as
			| {
					id: string;
					name: string;
					email: string;
					image: string | null;
			  }
			| undefined;

		if (!user) {
			throw new Error('User not found');
		}

		// Get user profile info
		const profile_stmt = db.prepare(
			'SELECT username, github_username, bio, tagline, location, website, visibility, qr_code_url FROM user_profiles WHERE user_id = ?',
		);
		const profile = profile_stmt.get(user_id) as
			| {
					username: string;
					github_username: string | null;
					bio: string | null;
					tagline: string | null;
					location: string | null;
					website: string | null;
					visibility: string;
					qr_code_url: string | null;
			  }
			| undefined;

		if (!profile) {
			throw new Error('Profile not found');
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			username: profile.username,
			github_username: profile.github_username,
			bio: profile.bio,
			tagline: profile.tagline,
			location: profile.location,
			website: profile.website,
			visibility: profile.visibility,
			qr_code_url: profile.qr_code_url,
		};
	},
);

/**
 * Get user's social links
 */
export const get_user_social_links = query(
	async (): Promise<UserSocialLink[]> => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(
			'SELECT id, platform, url FROM user_social_links WHERE user_id = ? ORDER BY created_at',
		);
		const links = stmt.all(user_id) as UserSocialLink[];

		return links;
	},
);

/**
 * Update basic user info (name, email)
 */
export const update_basic_info = guarded_form(
	v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
		email: v.pipe(v.string(), v.email('Invalid email address')),
	}),
	async ({ name, email }) => {
		if (await is_demo_account()) {
			return { error: 'Cannot modify demo account' };
		}

		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user SET name = ?, email = ?, updatedAt = ? WHERE id = ?',
		).run(name, email, new Date().toISOString(), user_id);

		return { success: true };
	},
);

/**
 * Update user name
 */
export const update_name = guarded_command(
	v.pipe(v.string(), v.minLength(1, 'Name is required')),
	async (name) => {
		if (await is_demo_account()) {
			throw new Error('Cannot modify demo account');
		}

		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user SET name = ?, updatedAt = ? WHERE id = ?',
		).run(name, new Date().toISOString(), user_id);

		return { success: true };
	},
);

/**
 * Update user email
 */
export const update_email = guarded_command(
	v.pipe(v.string(), v.email('Invalid email address')),
	async (email) => {
		if (await is_demo_account()) {
			throw new Error('Cannot modify demo account');
		}

		const user_id = await get_current_user_id();

		console.log('[update_email] Starting update', {
			user_id,
			email,
			timestamp: new Date().toISOString(),
		});

		try {
			db.prepare(
				'UPDATE user SET email = ?, updatedAt = ? WHERE id = ?',
			).run(email, new Date().toISOString(), user_id);

			console.log('[update_email] Successfully updated', { user_id });

			return { success: true };
		} catch (error) {
			console.error('[update_email] Failed to update', {
				user_id,
				error,
			});
			throw error;
		}
	},
);

/**
 * Update profile details
 */
export const update_profile_details = guarded_form(
	v.object({
		username: v.pipe(
			v.string(),
			v.minLength(3, 'Username must be at least 3 characters'),
			v.maxLength(30, 'Username must be less than 30 characters'),
			v.regex(
				/^[a-zA-Z0-9_-]+$/,
				'Username can only contain letters, numbers, hyphens, and underscores',
			),
		),
		bio: v.optional(v.string()),
		tagline: v.optional(v.string()),
		location: v.optional(v.string()),
		website: v.optional(v.pipe(v.string(), v.url('Invalid URL'))),
	}),
	async ({ username, bio, tagline, location, website }) => {
		if (await is_demo_account()) {
			return { error: 'Cannot modify demo account' };
		}

		const user_id = await get_current_user_id();

		// Check if username is already taken by another user
		const existing = db
			.prepare(
				'SELECT user_id FROM user_profiles WHERE username = ? AND user_id != ?',
			)
			.get(username, user_id);

		if (existing) {
			return { error: 'Username is already taken' };
		}

		db.prepare(
			`UPDATE user_profiles
			SET username = ?, bio = ?, tagline = ?, location = ?, website = ?, updated_at = ?
			WHERE user_id = ?`,
		).run(
			username,
			bio || null,
			tagline || null,
			location || null,
			website || null,
			Date.now(),
			user_id,
		);

		return { success: true };
	},
);

/**
 * Update username
 */
export const update_username = guarded_command(
	v.pipe(
		v.string(),
		v.minLength(3, 'Username must be at least 3 characters'),
		v.maxLength(30, 'Username must be less than 30 characters'),
		v.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Username can only contain letters, numbers, hyphens, and underscores',
		),
	),
	async (username) => {
		const user_id = await get_current_user_id();

		// Check if username is already taken by another user
		const existing = db
			.prepare(
				'SELECT user_id FROM user_profiles WHERE username = ? AND user_id != ?',
			)
			.get(username, user_id);

		if (existing) {
			throw new Error('Username is already taken');
		}

		db.prepare(
			'UPDATE user_profiles SET username = ?, updated_at = ? WHERE user_id = ?',
		).run(username, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update tagline
 */
export const update_tagline = guarded_command(
	v.optional(v.string()),
	async (tagline) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET tagline = ?, updated_at = ? WHERE user_id = ?',
		).run(tagline || null, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update location
 */
export const update_location = guarded_command(
	v.optional(v.string()),
	async (location) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET location = ?, updated_at = ? WHERE user_id = ?',
		).run(location || null, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update website
 */
export const update_website = guarded_command(
	v.optional(v.pipe(v.string(), v.url('Invalid URL'))),
	async (website) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET website = ?, updated_at = ? WHERE user_id = ?',
		).run(website || null, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update bio
 */
export const update_bio = guarded_command(
	v.optional(v.string()),
	async (bio) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET bio = ?, updated_at = ? WHERE user_id = ?',
		).run(bio || null, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Update profile visibility
 */
export const update_visibility = guarded_command(
	v.union([
		v.literal('public'),
		v.literal('unlisted'),
		v.literal('private'),
	]),
	async (visibility) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET visibility = ?, updated_at = ? WHERE user_id = ?',
		).run(visibility, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Add user social link
 */
export const add_user_social_link = guarded_command(
	v.object({
		platform: v.pipe(
			v.string(),
			v.minLength(1, 'Platform is required'),
		),
		url: v.pipe(v.string(), v.url('Invalid URL')),
	}),
	async (data: { platform: string; url: string }) => {
		const user_id = await get_current_user_id();

		const id = crypto.randomUUID();
		const now = Date.now();

		db.prepare(
			'INSERT INTO user_social_links (id, user_id, platform, url, created_at) VALUES (?, ?, ?, ?, ?)',
		).run(id, user_id, data.platform, data.url, now);

		return { success: true };
	},
);

/**
 * Delete user social link
 */
export const delete_user_social_link = guarded_command(
	v.string(),
	async (link_id) => {
		const user_id = await get_current_user_id();

		// Verify ownership before deleting
		const link = db
			.prepare('SELECT user_id FROM user_social_links WHERE id = ?')
			.get(link_id) as { user_id: string } | undefined;

		if (!link || link.user_id !== user_id) {
			throw new Error('Unauthorized');
		}

		db.prepare('DELETE FROM user_social_links WHERE id = ?').run(
			link_id,
		);

		return { success: true };
	},
);

/**
 * Get all connected authentication methods
 */
export const get_connected_auth_methods = query(
	async (): Promise<{
		has_credential: boolean;
		has_github: boolean;
		github_username: string | null;
	}> => {
		const user_id = await get_current_user_id();

		// Get all account providers for this user
		const accounts = db
			.prepare('SELECT providerId FROM account WHERE userId = ?')
			.all(user_id) as { providerId: string }[];

		const has_credential = accounts.some(
			(acc) => acc.providerId === 'credential',
		);
		const has_github = accounts.some(
			(acc) => acc.providerId === 'github',
		);

		// Get GitHub username from profile
		const profile = db
			.prepare(
				'SELECT github_username FROM user_profiles WHERE user_id = ?',
			)
			.get(user_id) as { github_username: string | null } | undefined;

		return {
			has_credential,
			has_github,
			github_username: profile?.github_username || null,
		};
	},
);

/**
 * Get GitHub connection status
 */
export const get_github_connection_status = query(
	async (): Promise<{
		is_connected: boolean;
		github_username: string | null;
	}> => {
		const user_id = await get_current_user_id();

		// Check if user has a GitHub account connected
		const account = db
			.prepare(
				"SELECT accountId FROM account WHERE userId = ? AND providerId = 'github'",
			)
			.get(user_id) as { accountId: string } | undefined;

		// Get GitHub username from profile
		const profile = db
			.prepare(
				'SELECT github_username FROM user_profiles WHERE user_id = ?',
			)
			.get(user_id) as { github_username: string | null } | undefined;

		return {
			is_connected: !!account,
			github_username: profile?.github_username || null,
		};
	},
);

/**
 * Disconnect GitHub account
 */
export const disconnect_github = guarded_command(
	v.undefined(),
	async () => {
		const user_id = await get_current_user_id();

		// Delete GitHub account connection
		db.prepare(
			"DELETE FROM account WHERE userId = ? AND providerId = 'github'",
		).run(user_id);

		// Clear GitHub username from profile
		db.prepare(
			'UPDATE user_profiles SET github_username = ?, updated_at = ? WHERE user_id = ?',
		).run(null, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Get user's QR code URL
 */
export const get_user_qr_code = query(
	async (): Promise<string | null> => {
		const user_id = await get_current_user_id();

		const stmt = db.prepare(
			'SELECT qr_code_url FROM user_profiles WHERE user_id = ?',
		);
		const result = stmt.get(user_id) as
			| { qr_code_url: string | null }
			| undefined;

		return result?.qr_code_url || null;
	},
);

/**
 * Save QR code data URL for user profile
 */
export const save_qr_code = guarded_command(
	v.object({
		qr_code_url: v.string(),
	}),
	async (data: { qr_code_url: string }) => {
		const user_id = await get_current_user_id();

		db.prepare(
			'UPDATE user_profiles SET qr_code_url = ?, updated_at = ? WHERE user_id = ?',
		).run(data.qr_code_url, Date.now(), user_id);

		return { success: true };
	},
);

/**
 * Get profile URL for QR code generation
 */
export const get_profile_qr_url = query(
	v.string(),
	async (origin): Promise<string> => {
		const user_id = await get_current_user_id();

		const profile_stmt = db.prepare(
			'SELECT username FROM user_profiles WHERE user_id = ?',
		);
		const profile = profile_stmt.get(user_id) as
			| { username: string }
			| undefined;

		if (!profile) {
			throw new Error('Profile not found');
		}

		return `${origin}/@${profile.username}?qr=1`;
	},
);

/**
 * Delete user account permanently
 * This will delete all user data including contacts, interactions, follow-ups, etc.
 * Requires password confirmation for credential-based accounts
 */
export const delete_account = guarded_command(
	v.pipe(
		v.string(),
		v.literal(
			'DELETE',
			'You must type DELETE to confirm account deletion',
		),
	),
	async () => {
		if (await is_demo_account()) {
			throw new Error('Cannot delete demo account');
		}

		const user_id = await get_current_user_id();
		const event = getRequestEvent();

		console.log(
			'[delete_account] Deleting user account and all related data',
			{
				user_id,
				timestamp: new Date().toISOString(),
			},
		);

		// Sign out the user first
		await auth.api.signOut({
			headers: event.request.headers,
		});

		// Delete the user record - CASCADE will handle all related data
		db.prepare('DELETE FROM user WHERE id = ?').run(user_id);

		console.log(
			'[delete_account] Successfully deleted user account',
			{
				user_id,
			},
		);

		return { success: true };
	},
);
