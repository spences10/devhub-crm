import { getRequestEvent, query } from '$app/server';
import * as env from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import {
	create_user_profile_from_github,
	fetch_github_user_data,
	user_has_profile,
} from '#lib/server/profile-helpers.ts';
import { redirect } from '@sveltejs/kit';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';

/**
 * Ensure user is authenticated and has a profile
 * Creates profile from GitHub data if missing
 */
export const ensure_profile = query(async () => {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (!session?.user) {
		redirect(302, '/login');
	}

	const user_id = session.user.id;

	// Check if user has a profile
	if (!user_has_profile(user_id)) {
		// Get the user's GitHub account
		const account_stmt = db.prepare(`
      SELECT * FROM account
      WHERE userId = ? AND providerId = 'github'
    `);

		const github_account = account_stmt.get(user_id) as
			| {
					accessToken: string;
			  }
			| undefined;

		if (github_account?.accessToken) {
			try {
				// Fetch GitHub user data
				const github_data = await fetch_github_user_data(
					github_account.accessToken,
				);

				// Create profile from GitHub data with access token for social accounts
				await create_user_profile_from_github(
					user_id,
					github_data,
					github_account.accessToken,
				);

				console.log('✅ Created user profile from GitHub data');
			} catch (error) {
				console.error('Failed to create profile from GitHub:', error);
				// Continue without profile - user can create manually later
			}
		} else {
			// Create default profile for credential users
			const user_stmt = db.prepare(`
        SELECT name, email FROM user WHERE id = ?
      `);
			const user = user_stmt.get(user_id) as
				| { name: string; email: string }
				| undefined;

			if (user) {
				const now = Date.now();
				const profile_id = crypto.randomUUID();
				// Generate username from email (before @)
				const base_username = user.email.split('@')[0];
				let username = base_username;

				// Check if username exists and make it unique if needed
				let attempt = 0;
				while (true) {
					const existing = db
						.prepare(
							'SELECT id FROM user_profiles WHERE username = ?',
						)
						.get(username);
					if (!existing) break;
					attempt++;
					username = `${base_username}${attempt}`;
				}

				db.prepare(
					`
          INSERT INTO user_profiles (
            id, user_id, username, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?)
        `,
				).run(profile_id, user_id, username, now, now);

				console.log(
					'✅ Created default user profile for credential user',
				);
			}
		}
	}

	return { authenticated: true };
});

/**
 * Check if current user is the demo account
 */
export const is_demo_user = query(async (): Promise<boolean> => {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	return session?.user?.email === DEMO_USER_EMAIL;
});
