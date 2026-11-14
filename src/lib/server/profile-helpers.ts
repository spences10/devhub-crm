import type { UserProfile } from '#lib/types/db.ts';
import { db } from './db';

/**
 * Create a user profile from GitHub OAuth data
 */
export async function create_user_profile_from_github(
	user_id: string,
	github_data: {
		login: string;
		bio?: string | null;
		location?: string | null;
		blog?: string | null;
		twitter_username?: string | null;
		html_url?: string;
	},
	access_token?: string,
): Promise<UserProfile> {
	const now = Date.now();
	const profile_id = crypto.randomUUID();

	// Create profile
	const create_profile_stmt = db.prepare(`
    INSERT INTO user_profiles (
      id, user_id, username, github_username,
      bio, location, website, github_synced_at,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

	create_profile_stmt.run(
		profile_id,
		user_id,
		github_data.login,
		github_data.login,
		github_data.bio || null,
		github_data.location || null,
		github_data.blog || null,
		now,
		now,
		now,
	);

	// Track added social links to avoid duplicates
	const added_platforms = new Set<string>();

	const create_social_link_stmt = db.prepare(`
    INSERT INTO user_social_links (id, user_id, platform, url, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

	// Create social links
	if (github_data.html_url) {
		create_social_link_stmt.run(
			crypto.randomUUID(),
			user_id,
			'github',
			github_data.html_url,
			now,
		);
		added_platforms.add('github');
	}

	if (github_data.twitter_username) {
		create_social_link_stmt.run(
			crypto.randomUUID(),
			user_id,
			'twitter',
			`https://twitter.com/${github_data.twitter_username}`,
			now,
		);
		added_platforms.add('twitter');
	}

	// Fetch and add social accounts if access token is provided
	if (access_token) {
		const social_accounts =
			await fetch_github_social_accounts(access_token);

		// Platform mapping for supported platforms
		const platform_map: Record<string, string> = {
			twitter: 'twitter',
			linkedin: 'linkedin',
			youtube: 'youtube',
			bluesky: 'bluesky',
		};

		for (const account of social_accounts) {
			const platform = platform_map[account.provider.toLowerCase()];

			// Only add supported platforms that haven't been added yet
			if (platform && !added_platforms.has(platform)) {
				create_social_link_stmt.run(
					crypto.randomUUID(),
					user_id,
					platform,
					account.url,
					now,
				);
				added_platforms.add(platform);
			}
		}
	}

	// Return the created profile
	const get_profile_stmt = db.prepare(`
    SELECT * FROM user_profiles WHERE id = ?
  `);

	return get_profile_stmt.get(profile_id) as UserProfile;
}

/**
 * Check if a user has a profile
 */
export function user_has_profile(user_id: string): boolean {
	const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_profiles WHERE user_id = ?
  `);

	const result = stmt.get(user_id) as { count: number };
	return result.count > 0;
}

/**
 * Fetch GitHub user data from their API using access token
 */
export async function fetch_github_user_data(access_token: string) {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${access_token}`,
			Accept: 'application/vnd.github.v3+json',
		},
	});

	if (!response.ok) {
		throw new Error('Failed to fetch GitHub user data');
	}

	return await response.json();
}

/**
 * Fetch GitHub user's social accounts using access token
 */
export async function fetch_github_social_accounts(
	access_token: string,
): Promise<Array<{ provider: string; url: string }>> {
	try {
		const response = await fetch(
			'https://api.github.com/user/social_accounts',
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
					Accept: 'application/vnd.github.v3+json',
				},
			},
		);

		if (!response.ok) {
			console.warn('Failed to fetch GitHub social accounts');
			return [];
		}

		return await response.json();
	} catch (error) {
		console.warn('Error fetching GitHub social accounts:', error);
		return [];
	}
}
