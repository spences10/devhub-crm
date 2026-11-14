<script lang="ts">
	import { auth_client } from '#lib/client/auth.ts';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import { Button } from '#lib/components/ui/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import GithubConnectionStatus from './github-connection-status.svelte';
	import {
		cache_github_profiles,
		check_github_connection,
		fetch_github_following_chunk,
		get_github_following_info,
		import_github_contacts,
	} from './github-import.remote';
	import GithubUserCard from './github-user-card.svelte';

	let is_authorizing = $state(false);
	let is_importing = $state(false);
	let selected_usernames = $state<Set<string>>(new Set());
	let following_list = $state<any[]>([]);
	let search = $state('');
	let import_result = $state<
		| {
				success: true;
				imported_count: number;
				skipped_count: number;
		  }
		| {
				success: false;
				error: string;
		  }
		| null
	>(null);

	// Single state object for GitHub import flow
	let github_state = $state<
		| { stage: 'initial' }
		| {
				stage: 'info_loaded';
				following_count: number;
				followers_count: number;
				username: string;
				rate_limit: {
					limit: number;
					remaining: number;
					used: number;
					reset: number;
				};
				estimates: {
					api_calls: number;
					time_seconds: number;
				};
				cache: {
					has_cache: boolean;
					cached_at: number | null;
				};
		  }
		| {
				stage: 'loading';
				loaded: number;
				total: number;
		  }
		| { stage: 'complete' }
	>({ stage: 'initial' });

	let import_progress = $state<{
		imported: number;
		total: number;
	} | null>(null);

	async function handle_connect_github() {
		try {
			is_authorizing = true;
			await auth_client.linkSocial({
				provider: 'github',
				scopes: ['user:follow'],
				callbackURL: '/contacts/import/github',
			});
		} catch (error) {
			console.error('Error connecting GitHub:', error);
			is_authorizing = false;
		}
	}

	async function handle_authorize_additional_scope() {
		try {
			is_authorizing = true;
			await auth_client.linkSocial({
				provider: 'github',
				scopes: ['user:follow'],
				callbackURL: '/contacts/import/github',
			});
		} catch (error) {
			console.error('Error authorizing GitHub scope:', error);
			is_authorizing = false;
		}
	}

	async function handle_fetch_info() {
		try {
			const result = await get_github_following_info();
			if (result.success) {
				github_state = {
					stage: 'info_loaded',
					following_count: result.following_count,
					followers_count: result.followers_count,
					username: result.username,
					rate_limit: result.rate_limit,
					estimates: result.estimates,
					cache: result.cache,
				};
			} else if (result.error) {
				console.error('Error fetching info:', result.error);
				import_result = {
					success: false,
					error: result.error,
				};
			}
		} catch (error) {
			console.error('Error fetching info:', error);
			import_result = {
				success: false,
				error: 'Failed to fetch GitHub info',
			};
		}
	}

	async function handle_load_following(force_refresh = false) {
		if (github_state.stage !== 'info_loaded') return;

		try {
			const total = github_state.following_count;
			github_state = {
				stage: 'loading',
				loaded: 0,
				total,
			};

			const chunk_size = 50;
			let offset = 0;
			let has_more = true;
			const all_profiles: any[] = [];
			let from_cache = false;

			while (has_more) {
				const result = await fetch_github_following_chunk({
					offset,
					limit: chunk_size,
					force_refresh,
				});

				if (result.success && result.profiles) {
					all_profiles.push(...result.profiles);
					offset = result.offset || offset + chunk_size;
					has_more = result.has_more || false;
					from_cache = result.from_cache || false;

					// Update progress
					github_state = {
						stage: 'loading',
						loaded: result.total_loaded || all_profiles.length,
						total,
					};
				} else if (result.error) {
					console.error('Error loading chunk:', result.error);
					import_result = {
						success: false,
						error: result.error,
					};
					github_state = { stage: 'initial' };
					break;
				}
			}

			following_list = all_profiles;
			github_state = { stage: 'complete' };

			// If we fetched from API (not cache), save to cache
			if (!from_cache && all_profiles.length > 0) {
				try {
					await cache_github_profiles({ profiles: all_profiles });
				} catch (error) {
					console.error('Failed to cache profiles:', error);
					// Don't fail the whole operation if caching fails
				}
			}
		} catch (error) {
			console.error('Error loading following:', error);
			import_result = {
				success: false,
				error: 'Failed to load following list',
			};
			github_state = { stage: 'initial' };
		}
	}

	function toggle_selection(username: string) {
		if (selected_usernames.has(username)) {
			selected_usernames.delete(username);
		} else {
			selected_usernames.add(username);
		}
		selected_usernames = new Set(selected_usernames);
	}

	function select_all_not_imported() {
		const not_imported = following_list
			.filter((user) => !user.already_imported)
			.map((user) => user.login);
		selected_usernames = new Set(not_imported);
	}

	function deselect_all() {
		selected_usernames = new Set();
	}

	async function handle_import() {
		if (selected_usernames.size === 0) return;

		try {
			is_importing = true;
			import_result = null;

			const usernames_array = Array.from(selected_usernames);
			const batch_size = 25; // Import 25 contacts at a time
			let total_imported = 0;
			let total_skipped = 0;

			// Initialize progress
			import_progress = {
				imported: 0,
				total: usernames_array.length,
			};

			// Process in batches
			for (let i = 0; i < usernames_array.length; i += batch_size) {
				const batch = usernames_array.slice(i, i + batch_size);
				const result = await import_github_contacts({
					usernames: batch,
				});

				if (result.success) {
					total_imported += result.imported_count || 0;
					total_skipped += result.skipped_count || 0;

					// Update progress
					import_progress = {
						imported: Math.min(
							i + batch_size,
							usernames_array.length,
						),
						total: usernames_array.length,
					};
				} else {
					import_result = {
						success: false,
						error: result.error || 'An unexpected error occurred',
					};
					return;
				}
			}

			import_result = {
				success: true,
				imported_count: total_imported,
				skipped_count: total_skipped,
			};

			// Reload the following list to update "already imported" flags
			await handle_load_following();
			selected_usernames = new Set();
		} catch (error) {
			console.error('Error importing contacts:', error);
			import_result = {
				success: false,
				error: 'An unexpected error occurred',
			};
		} finally {
			is_importing = false;
			import_progress = null;
		}
	}

	function filter_following(users: any[], query: string) {
		if (!query) return users;
		const q = query.toLowerCase();
		return users.filter(
			(user) =>
				user.login?.toLowerCase().includes(q) ||
				user.name?.toLowerCase().includes(q) ||
				user.bio?.toLowerCase().includes(q),
		);
	}
</script>

<Head seo_config={seo_configs.contacts} />

<PageHeaderWithAction title="Import from GitHub">
	<Button href="/contacts" variant="outline" size="sm">
		Back to Contacts
	</Button>
</PageHeaderWithAction>
<PageNav />

{#await check_github_connection() then connection}
	{#if connection.connected && connection.has_follow_scope && github_state.stage === 'initial' && following_list.length === 0}
		{@const _ = handle_fetch_info()}
	{/if}

	<GithubConnectionStatus
		{connection}
		{is_authorizing}
		following_list_length={following_list.length}
		{github_state}
		on_connect={handle_connect_github}
		on_authorize={handle_authorize_additional_scope}
		on_load_following={github_state.stage === 'info_loaded'
			? () => handle_load_following(false)
			: handle_fetch_info}
		on_refresh={github_state.stage === 'info_loaded'
			? () => handle_load_following(true)
			: handle_fetch_info}
		on_cancel={() => {
			github_state = { stage: 'initial' };
		}}
	/>

	<!-- Import Results -->
	{#if import_result}
		<div
			class="mb-6 alert {import_result.success
				? 'alert-success'
				: 'alert-error'}"
		>
			{#if import_result.success}
				<span>
					Successfully imported {import_result.imported_count}
					contact{import_result.imported_count === 1 ? '' : 's'}!
					{#if import_result.skipped_count && import_result.skipped_count > 0}
						Skipped {import_result.skipped_count}
						duplicate{import_result.skipped_count === 1 ? '' : 's'}.
					{/if}
				</span>
			{:else}
				<span>
					Error: {import_result.error || 'Failed to import contacts'}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Following List -->
	{#if following_list.length > 0}
		<!-- Search Bar -->
		<div class="mb-6">
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Search</legend>
				<label class="input w-full">
					<input
						type="text"
						bind:value={search}
						placeholder="Search by username, name, or bio..."
						class="grow"
					/>
				</label>
			</fieldset>
		</div>

		<!-- Actions -->
		<div class="mb-6 flex flex-wrap gap-2">
			<Button
				variant="ghost"
				size="sm"
				onclick={select_all_not_imported}
			>
				Select All New
			</Button>
			<Button variant="ghost" size="sm" onclick={deselect_all}>
				Deselect All
			</Button>
			<Button
				variant="primary"
				size="sm"
				onclick={handle_import}
				disabled={selected_usernames.size === 0 || is_importing}
			>
				{#if is_importing}
					<span class="loading loading-spinner"></span>
					{#if import_progress}
						Importing: {import_progress.imported}/{import_progress.total}
						({Math.round(
							(import_progress.imported / import_progress.total) *
								100,
						)}%)
					{:else}
						Importing {selected_usernames.size}
						contact{selected_usernames.size === 1 ? '' : 's'}...
					{/if}
				{:else}
					Import {selected_usernames.size} Selected
				{/if}
			</Button>
		</div>

		<!-- User Grid -->
		{@const filtered = filter_following(following_list, search)}
		{#if filtered.length === 0}
			<div class="alert">
				<span>No users found matching your search.</span>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filtered as user}
					<GithubUserCard
						{user}
						selected={selected_usernames.has(user.login)}
						on_toggle={toggle_selection}
					/>
				{/each}
			</div>

			<div class="mt-6 text-center text-sm opacity-70">
				Showing {filtered.length} of {following_list.length}
				user{following_list.length === 1 ? '' : 's'}
			</div>
		{/if}
	{/if}
{/await}
