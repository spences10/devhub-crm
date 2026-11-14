import { command, getRequestEvent, query } from '$app/server';
import * as env from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import type { UserProfile, UserSocialLink } from '#lib/types/db.ts';
import * as v from 'valibot';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';

export interface ProfileWithSocials extends UserProfile {
	name: string;
	image: string | null;
	social_links: UserSocialLink[];
	qr_code_url: string | null;
}

/**
 * Get public profile by username
 * Respects visibility settings: public, unlisted, and private
 * Note: Demo users are treated as unauthenticated for privacy purposes
 */
export const get_profile = query.batch(
	v.pipe(v.string(), v.minLength(1)),
	async (usernames) => {
		const event = getRequestEvent();

		// Check if viewer is authenticated (excluding demo user)
		const session = await auth.api.getSession({
			headers: event.request.headers,
		});
		const is_demo_user = session?.user?.email === DEMO_USER_EMAIL;
		const is_authenticated = !!session?.user && !is_demo_user;

		// Fetch all profiles with user image and name in a single query
		// Note: We fetch all profiles first, then filter by visibility in code
		// to handle authentication-dependent access
		const profile_stmt = db.prepare(`
      SELECT
        up.*,
        u.name,
        u.image
      FROM user_profiles up
      JOIN user u ON up.user_id = u.id
      WHERE up.username IN (${usernames.map(() => '?').join(',')})
    `);

		const all_profiles = profile_stmt.all(
			...usernames,
		) as (UserProfile & {
			name: string;
			image: string | null;
			qr_code_url: string | null;
		})[];

		// Filter profiles based on visibility and authentication
		const profiles = all_profiles.filter((profile) => {
			if (profile.visibility === 'public') return true;
			if (profile.visibility === 'unlisted') return true;
			if (profile.visibility === 'private') return is_authenticated;
			return false; // Unknown visibility values are hidden
		});

		// Fetch social links for all visible profiles
		const user_ids = profiles.map((p) => p.user_id);

		if (user_ids.length === 0) {
			return () => null;
		}

		const socials_stmt = db.prepare(`
      SELECT * FROM user_social_links
      WHERE user_id IN (${user_ids.map(() => '?').join(',')})
      ORDER BY platform
    `);

		const all_social_links = socials_stmt.all(
			...user_ids,
		) as UserSocialLink[];

		// Return lookup function
		return (username: string): ProfileWithSocials | null => {
			const profile = profiles.find((p) => p.username === username);

			if (!profile) {
				return null;
			}

			const social_links = all_social_links.filter(
				(link) => link.user_id === profile.user_id,
			);

			return { ...profile, social_links };
		};
	},
);

/**
 * Track profile view for analytics
 */
export const track_profile_view = command(
	v.object({
		username: v.pipe(v.string(), v.minLength(1)),
		qr_scan: v.boolean(),
		referrer: v.nullable(v.string()),
	}),
	async ({ username, qr_scan, referrer }) => {
		const event = getRequestEvent();

		// Get current user if logged in
		const session = await auth.api.getSession({
			headers: event.request.headers,
		});

		const viewer_id = session?.user?.id || null;

		// Get the profile owner's user_id
		const profile_stmt = db.prepare(`
      SELECT user_id FROM user_profiles WHERE username = ?
    `);

		const profile = profile_stmt.get(username) as
			| { user_id: string }
			| undefined;

		if (!profile) {
			return { success: false, error: 'Profile not found' };
		}

		// Don't track own profile views
		if (viewer_id === profile.user_id) {
			return { success: true, self_view: true };
		}

		// Insert profile view
		const insert_stmt = db.prepare(`
      INSERT INTO profile_views (
        id, user_id, viewer_id, qr_scan, referrer, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

		insert_stmt.run(
			crypto.randomUUID(),
			profile.user_id,
			viewer_id,
			qr_scan ? 1 : 0,
			referrer,
			Date.now(),
		);

		return { success: true };
	},
);
