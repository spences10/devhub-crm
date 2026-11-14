<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import Surface from '#lib/components/surface.svelte';
	import { Button } from '#lib/components/ui/index.ts';
	import { format } from 'date-fns';

	interface ConnectionStatus {
		connected: boolean;
		has_follow_scope: boolean;
		username?: string;
	}

	type GithubState =
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
		| { stage: 'complete' };

	interface Props {
		connection: ConnectionStatus;
		is_authorizing: boolean;
		following_list_length: number;
		github_state: GithubState;
		on_connect: () => void;
		on_authorize: () => void;
		on_load_following: () => void;
		on_refresh: () => void;
		on_cancel: () => void;
	}

	let {
		connection,
		is_authorizing,
		following_list_length,
		github_state,
		on_connect,
		on_authorize,
		on_load_following,
		on_refresh,
		on_cancel,
	}: Props = $props();

	function format_time_estimate(seconds: number): string {
		if (seconds < 60) {
			return `${seconds} seconds`;
		} else {
			const minutes = Math.ceil(seconds / 60);
			return `${minutes} minute${minutes === 1 ? '' : 's'}`;
		}
	}

	function format_reset_time(reset_timestamp: number): string {
		const now = Date.now() / 1000;
		const seconds_until_reset = reset_timestamp - now;
		if (seconds_until_reset < 0) return 'now';
		const minutes = Math.ceil(seconds_until_reset / 60);
		return `${minutes} minute${minutes === 1 ? '' : 's'}`;
	}
</script>

{#if !connection.connected}
	<!-- Not connected to GitHub -->
	<BaseCard class="mb-6">
		{#snippet children()}
			<h2 class="card-title">Connect Your GitHub Account</h2>
			<p class="text-sm opacity-70">
				To import contacts from GitHub, you need to connect your
				GitHub account and grant access to your following list.
			</p>
			<div class="card-actions justify-end">
				<button
					class="btn btn-primary"
					onclick={on_connect}
					disabled={is_authorizing}
				>
					{#if is_authorizing}
						<span class="loading loading-spinner"></span>
						Connecting...
					{:else}
						Connect GitHub
					{/if}
				</button>
			</div>
		{/snippet}
	</BaseCard>
{:else if !connection.has_follow_scope}
	<!-- Connected but missing scope -->
	<BaseCard class="mb-6">
		{#snippet children()}
			<h2 class="card-title">Additional Permission Required</h2>
			<p class="text-sm opacity-70">
				Your GitHub account is connected, but we need additional
				permission to access your following list.
			</p>
			<p class="mt-2 text-sm opacity-70">
				<strong>Why we need this:</strong> To show you the list of people
				you follow on GitHub so you can import them as contacts.
			</p>
			<p class="mt-1 text-sm opacity-70">
				<strong>What we request:</strong> Read-only access to your
				following list (<code>user:follow</code> scope)
			</p>
			<div class="card-actions justify-end">
				<button
					class="btn btn-primary"
					onclick={on_authorize}
					disabled={is_authorizing}
				>
					{#if is_authorizing}
						<span class="loading loading-spinner"></span>
						Authorizing...
					{:else}
						Authorize GitHub Access
					{/if}
				</button>
			</div>
		{/snippet}
	</BaseCard>
{:else}
	<!-- Connected with proper scope -->
	<BaseCard class="mb-6">
		{#snippet children()}
			<h2 class="card-title">GitHub Connected</h2>
			<p class="text-sm opacity-70">
				Your GitHub account (@{connection.username}) is connected and
				authorized.
			</p>

			{#if github_state.stage === 'info_loaded'}
				{#if github_state.cache.has_cache}
					<!-- Cache exists - show info and load from cache option -->
					<div
						class="mt-4 rounded-box border-2 border-info bg-base-100 p-4"
					>
						<div class="flex items-start gap-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 shrink-0 stroke-info"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div class="flex-1">
								<h3 class="font-bold">Cached Data Available</h3>
								<div class="mt-2 space-y-2 text-sm">
									<p>
										<strong
											>You follow {github_state.following_count} people
											on GitHub</strong
										>
									</p>
									<p class="opacity-80">
										Cached {format(
											github_state.cache.cached_at!,
											'PPpp',
										)}
										(loads instantly from cache)
									</p>
								</div>
								<div class="mt-4 flex gap-2">
									<button
										class="btn btn-primary btn-sm"
										onclick={on_load_following}
									>
										Load from Cache
									</button>
									<button
										class="btn btn-ghost btn-sm"
										onclick={on_refresh}
									>
										Refresh from GitHub
									</button>
									<button
										class="btn btn-ghost btn-sm"
										onclick={on_cancel}
									>
										Cancel
									</button>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- No cache - show warning with following info -->
					<div
						class="mt-4 rounded-box border-2 border-warning bg-base-100 p-4"
					>
						<div class="flex items-start gap-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 shrink-0 stroke-warning"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<div class="flex-1">
								<h3 class="font-bold">Before You Continue</h3>
								<div class="mt-2 space-y-2 text-sm">
									<p>
										<strong
											>You follow {github_state.following_count} people
											on GitHub</strong
										>
									</p>
									<ul
										class="list-inside list-disc space-y-1 opacity-80"
									>
										<li>
											This will make approximately <strong
												>{github_state.estimates.api_calls} GitHub API requests</strong
											>
										</li>
										<li>
											Uses your GitHub rate limit (currently <strong
												>{github_state.rate_limit.remaining.toLocaleString()}/{github_state.rate_limit.limit.toLocaleString()}
												remaining</strong
											>)
										</li>
										<li>
											Rate limit resets in <strong
												>{format_reset_time(
													github_state.rate_limit.reset,
												)}</strong
											>
										</li>
										<li>
											Estimated time: <strong
												>{format_time_estimate(
													github_state.estimates.time_seconds,
												)}</strong
											>
										</li>
										{#if github_state.rate_limit.remaining < github_state.estimates.api_calls}
											<li class="font-semibold text-error">
												Warning: You may hit your rate limit!
											</li>
										{/if}
									</ul>
								</div>
								<div class="mt-4 flex gap-2">
									<button
										class="btn btn-primary btn-sm"
										onclick={on_load_following}
									>
										I Understand, Proceed
									</button>
									<button
										class="btn btn-ghost btn-sm"
										onclick={on_cancel}
									>
										Cancel
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{:else if github_state.stage === 'loading'}
				<!-- Show loading progress -->
				<Surface class="mt-4">
					<div class="flex flex-col gap-3">
						<p class="flex items-center gap-2 text-sm opacity-70">
							<span class="loading loading-sm loading-spinner"></span>
							<span>
								Loading profiles: <strong
									>{github_state.loaded}/{github_state.total}</strong
								>
								({Math.round(
									(github_state.loaded / github_state.total) * 100,
								)}%)
							</span>
						</p>
						<progress
							class="progress progress-primary"
							value={github_state.loaded}
							max={github_state.total}
						></progress>
					</div>
				</Surface>
			{:else if following_list_length === 0}
				<!-- Initial state - show load button -->
				<div class="card-actions justify-end">
					<Button variant="primary" onclick={on_load_following}>
						Load Following List
					</Button>
				</div>
			{/if}
		{/snippet}
	</BaseCard>
{/if}
