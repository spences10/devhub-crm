import { command, query } from '$app/server';
import { get_current_user_id } from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import { github_profile_to_contact } from '#lib/server/github.ts';
import {
	check_github_scopes,
	clear_cache,
	fetch_following_chunk,
	fetch_user_profiles_batch,
	get_cache_timestamp,
	get_cached_profiles,
	get_following_count,
	get_rate_limit_status,
	save_profiles_to_cache,
} from '#lib/server/github-following.ts';
import * as v from 'valibot';

/**
 * Get the GitHub OAuth token for the current user
 */
async function get_github_token(): Promise<{
	access_token: string;
	username: string;
	has_follow_scope: boolean;
} | null> {
	const user_id = await get_current_user_id();

	// Get the GitHub account record for this user
	const account_stmt = db.prepare(`
    SELECT accessToken, accountId FROM account
    WHERE userId = ? AND providerId = 'github'
  `);

	const account = account_stmt.get(user_id) as
		| {
				accessToken: string | null;
				accountId: string;
		  }
		| undefined;

	if (!account || !account.accessToken) {
		return null;
	}

	// Check live GitHub API for scopes (don't trust database scope field)
	try {
		const scope_check = await check_github_scopes(
			account.accessToken,
		);
		return {
			access_token: account.accessToken,
			username: account.accountId,
			has_follow_scope: scope_check.has_follow_scope,
		};
	} catch (error) {
		console.error('Error checking GitHub scopes:', error);
		return null;
	}
}

/**
 * Check GitHub connection status (fast - DB only)
 * Scopes are verified when actually fetching data
 */
export const check_github_connection = query(
	async (): Promise<{
		connected: boolean;
		has_follow_scope: boolean;
		username?: string;
	}> => {
		try {
			const user_id = await get_current_user_id();

			// Check if token exists and get GitHub username from profile
			const account_stmt = db.prepare(`
        SELECT
          a.accessToken,
          a.accountId,
          a.scope,
          p.github_username
        FROM account a
        LEFT JOIN user_profiles p ON a.userId = p.user_id
        WHERE a.userId = ? AND a.providerId = 'github'
      `);

			const account = account_stmt.get(user_id) as
				| {
						accessToken: string | null;
						accountId: string;
						scope: string | null;
						github_username: string | null;
				  }
				| undefined;

			if (!account || !account.accessToken) {
				return {
					connected: false,
					has_follow_scope: false,
				};
			}

			// Check scope from DB (might be stale, but fast)
			// Scopes are comma-separated in Better Auth
			const scopes = account.scope
				? account.scope.split(',').map((s) => s.trim())
				: [];
			const has_follow_scope = scopes.includes('user:follow');

			return {
				connected: true,
				has_follow_scope,
				// Use github_username from profile, fallback to accountId if not set
				username: account.github_username || account.accountId,
			};
		} catch (error) {
			console.error('Error checking GitHub connection:', error);
			return {
				connected: false,
				has_follow_scope: false,
			};
		}
	},
);

/**
 * Get the authenticated user's following count and rate limit info
 * This is called BEFORE loading the full list to show a warning
 */
export const get_github_following_info = query(async () => {
	try {
		const user_id = await get_current_user_id();
		const token_data = await get_github_token();

		if (!token_data) {
			return {
				error: 'GitHub account not connected',
			};
		}

		if (!token_data.has_follow_scope) {
			return {
				error:
					'Missing required GitHub permissions. Please reconnect your GitHub account.',
			};
		}

		// Check if we have cached data
		const cache_timestamp = get_cache_timestamp(user_id);
		const has_cache = cache_timestamp !== null;

		// Get following count
		const count_info = await get_following_count(
			token_data.access_token,
		);

		// Get rate limit status
		const rate_limit = await get_rate_limit_status(
			token_data.access_token,
		);

		// Calculate estimates
		const api_calls_needed =
			Math.ceil(count_info.following_count / 100) + // Paginated following list
			count_info.following_count; // Individual profile fetches

		// Estimate time: ~10 profiles per second with batching and delays
		const estimated_seconds = Math.ceil(
			count_info.following_count / 10,
		);

		return {
			success: true,
			following_count: count_info.following_count,
			followers_count: count_info.followers_count,
			username: count_info.username,
			rate_limit: {
				limit: rate_limit.limit,
				remaining: rate_limit.remaining,
				used: rate_limit.used,
				reset: rate_limit.reset,
			},
			estimates: {
				api_calls: api_calls_needed,
				time_seconds: estimated_seconds,
			},
			cache: {
				has_cache,
				cached_at: cache_timestamp,
			},
		};
	} catch (error: any) {
		console.error('Error fetching GitHub following info:', error);
		return {
			error: error.message || 'Failed to fetch GitHub info',
		};
	}
});

/**
 * Fetch a chunk of users the current user follows on GitHub
 * This enables chunked loading with progress feedback
 * Now uses cache to avoid repeated API calls
 */
export const fetch_github_following_chunk = query(
	v.object({
		offset: v.pipe(v.number(), v.minValue(0)),
		limit: v.pipe(v.number(), v.minValue(1), v.maxValue(100)),
		force_refresh: v.optional(v.boolean()),
	}),
	async (params: {
		offset: number;
		limit: number;
		force_refresh?: boolean;
	}) => {
		try {
			const user_id = await get_current_user_id();
			const token_data = await get_github_token();

			if (!token_data) {
				return {
					error: 'GitHub account not connected',
				};
			}

			if (!token_data.has_follow_scope) {
				return {
					error:
						'Missing required GitHub permissions. Please reconnect your GitHub account.',
				};
			}

			// Clear cache if force refresh requested
			if (params.force_refresh && params.offset === 0) {
				clear_cache(user_id);
			}

			// Try to get cached profiles
			const cached_profiles = get_cached_profiles(user_id);

			// If cache exists and we're not forcing refresh, use cache
			if (cached_profiles && !params.force_refresh) {
				// Using cache - slice the requested chunk
				const total = cached_profiles.length;
				const end = Math.min(params.offset + params.limit, total);
				const chunk = cached_profiles.slice(params.offset, end);

				// Get existing contacts to mark duplicates
				const existing_contacts_stmt = db.prepare(`
          SELECT github_username FROM contacts
          WHERE user_id = ? AND github_username IS NOT NULL
        `);
				const existing_contacts = existing_contacts_stmt.all(
					user_id,
				) as Array<{
					github_username: string;
				}>;
				const existing_usernames = new Set(
					existing_contacts.map((c) =>
						c.github_username.toLowerCase(),
					),
				);

				return {
					success: true,
					profiles: chunk.map((profile) => ({
						...profile,
						already_imported: existing_usernames.has(
							profile.login.toLowerCase(),
						),
					})),
					has_more: end < total,
					offset: end,
					total_loaded: end,
					from_cache: true,
				};
			}

			// No cache or force refresh - fetch from GitHub API
			const chunk_result = await fetch_following_chunk(
				token_data.access_token,
				params.offset,
				params.limit,
			);

			// Get existing contacts to mark duplicates
			const existing_contacts_stmt = db.prepare(`
        SELECT github_username FROM contacts
        WHERE user_id = ? AND github_username IS NOT NULL
      `);
			const existing_contacts = existing_contacts_stmt.all(
				user_id,
			) as Array<{
				github_username: string;
			}>;
			const existing_usernames = new Set(
				existing_contacts.map((c) => c.github_username.toLowerCase()),
			);

			return {
				success: true,
				profiles: chunk_result.profiles.map((profile) => ({
					...profile,
					already_imported: existing_usernames.has(
						profile.login.toLowerCase(),
					),
				})),
				has_more: chunk_result.has_more,
				offset: chunk_result.offset,
				total_loaded: chunk_result.total_loaded,
				from_cache: false,
			};
		} catch (error: any) {
			console.error('Error fetching GitHub following chunk:', error);
			return {
				error:
					error.message || 'Failed to fetch GitHub following chunk',
			};
		}
	},
);

/**
 * Import selected GitHub users as contacts
 */
export const import_github_contacts = command(
	v.object({
		usernames: v.array(v.string()),
	}),
	async (data: { usernames: string[] }) => {
		try {
			const user_id = await get_current_user_id();
			const token_data = await get_github_token();

			if (!token_data) {
				return {
					error: 'GitHub account not connected',
				};
			}

			if (!token_data.has_follow_scope) {
				return {
					error: 'Missing required GitHub permissions',
				};
			}

			// Fetch profiles for selected users
			const profiles = await fetch_user_profiles_batch(
				token_data.access_token,
				data.usernames,
				10,
			);

			// Check which contacts already exist
			const placeholders = data.usernames.map(() => '?').join(',');
			const existing_stmt = db.prepare(`
        SELECT github_username FROM contacts
        WHERE user_id = ? AND LOWER(github_username) IN (${placeholders})
      `);
			const existing = existing_stmt.all(
				user_id,
				...data.usernames.map((u) => u.toLowerCase()),
			) as Array<{ github_username: string }>;
			const existing_set = new Set(
				existing.map((e) => e.github_username.toLowerCase()),
			);

			// Import contacts
			const insert_stmt = db.prepare(`
        INSERT INTO contacts (
          id, user_id, name, email, company,
          github_username, avatar_url, notes,
          last_contacted_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

			const social_link_stmt = db.prepare(`
        INSERT INTO social_links (id, contact_id, platform, url, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

			const now = Date.now();
			let imported_count = 0;
			let skipped_count = 0;

			for (const profile of profiles) {
				// Skip if already exists
				if (existing_set.has(profile.login.toLowerCase())) {
					skipped_count++;
					continue;
				}

				const contact_data = github_profile_to_contact(profile);
				const contact_id = crypto.randomUUID();

				// Insert contact
				insert_stmt.run(
					contact_id,
					user_id,
					contact_data.name,
					contact_data.email || null,
					contact_data.company || null,
					contact_data.github_username,
					contact_data.avatar_url,
					contact_data.notes,
					null, // last_contacted_at
					now,
					now,
				);

				// Insert social links
				for (const link of contact_data.social_links) {
					social_link_stmt.run(
						crypto.randomUUID(),
						contact_id,
						link.platform,
						link.url,
						now,
					);
				}

				imported_count++;
			}

			return {
				success: true,
				imported_count,
				skipped_count,
			};
		} catch (error: any) {
			console.error('Error importing GitHub contacts:', error);
			return {
				error: error.message || 'Failed to import contacts',
			};
		}
	},
);

/**
 * Save GitHub profiles to cache
 * Called after all chunks have been loaded to cache the full list
 */
export const cache_github_profiles = command(
	v.object({
		profiles: v.array(v.any()),
	}),
	async (data: { profiles: any[] }) => {
		try {
			const user_id = await get_current_user_id();
			save_profiles_to_cache(user_id, data.profiles);

			return {
				success: true,
			};
		} catch (error: any) {
			console.error('Error caching profiles:', error);
			return {
				error: error.message || 'Failed to cache profiles',
			};
		}
	},
);

/**
 * Clear the GitHub following cache
 */
export const clear_github_cache = command(async () => {
	try {
		const user_id = await get_current_user_id();
		clear_cache(user_id);

		return {
			success: true,
		};
	} catch (error: any) {
		console.error('Error clearing cache:', error);
		return {
			error: error.message || 'Failed to clear cache',
		};
	}
});
