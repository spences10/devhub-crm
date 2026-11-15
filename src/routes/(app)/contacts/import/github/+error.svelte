<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import {
		get_error_description,
		get_error_title,
	} from '#lib/utils/error-messages.ts';
	import { get_current_user } from '../../../../auth.remote';

	const status = $derived(page.status);

	// GitHub-specific error overrides
	const github_messages: Record<number, string> = {
		401: 'GitHub Authorization Required',
		403: 'GitHub API Rate Limit Exceeded',
		404: 'GitHub Resource Not Found',
		500: 'GitHub Integration Error',
		503: 'GitHub API Unavailable',
	};

	const github_descriptions: Record<number, string> = {
		401: 'Your GitHub authorization may have expired or been revoked. Please reconnect your GitHub account.',
		403: 'You have exceeded the GitHub API rate limit. Please wait a few minutes and try again.',
		404: 'The GitHub resource could not be found. Your account may not have the required permissions.',
		500: 'There was an error communicating with GitHub. Please try again or contact support if the issue persists.',
		503: 'GitHub API is currently unavailable. Please try again in a few moments.',
	};

	const title = $derived(
		get_error_title(status, page.error?.message, github_messages),
	);
	const description = $derived(
		get_error_description(status, github_descriptions),
	);

	async function handle_logout() {
		const { logout } = await import('../../../../auth.remote');
		await logout();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100 shadow-lg">
		<div class="flex-1">
			<a href="/dashboard">
				<div class="btn btn-ghost text-xl">DevHub CRM</div>
			</a>
		</div>
		<div class="flex-none gap-2">
			{#await get_current_user() then user}
				{#if user}
					<div class="dropdown dropdown-end">
						<div
							tabindex="0"
							role="button"
							class="btn avatar btn-circle btn-ghost"
						>
							<div class="w-10 rounded-full">
								{#if user.image}
									<img src={user.image} alt={user.name} />
								{:else}
									<div
										class="flex h-full w-full items-center justify-center bg-neutral text-neutral-content"
									>
										<span class="text-xl">
											{user.name?.[0]?.toUpperCase()}
										</span>
									</div>
								{/if}
							</div>
						</div>
						<ul
							class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
						>
							<li class="menu-title">
								<span>{user.name}</span>
							</li>
							<li><a href="/dashboard">Dashboard</a></li>
							<li><a href="/contacts">Contacts</a></li>
							<li>
								<button onclick={handle_logout}>Logout</button>
							</li>
						</ul>
					</div>
				{/if}
			{/await}
		</div>
	</div>

	<main class="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 lg:p-10">
		<PageHeaderWithAction title="Import from GitHub">
			<a href="/contacts" class="btn btn-outline btn-ghost">
				Back to Contacts
			</a>
		</PageHeaderWithAction>
		<PageNav />

		<div
			class="mt-8 flex min-h-[50vh] flex-col items-center justify-center"
		>
			<div class="card w-full max-w-2xl bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-20 w-20 text-error"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>

					<h1 class="card-title text-2xl">
						{title}
					</h1>

					<p class="mt-2 text-base-content/70">
						{description}
					</p>

					{#if status === 403}
						<div class="mt-4 alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="h-6 w-6 shrink-0 stroke-current"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div class="text-left text-sm">
								<p class="font-semibold">GitHub API Rate Limits:</p>
								<ul class="mt-1 ml-4 list-disc">
									<li>Authenticated: 5,000 requests/hour</li>
									<li>Your rate limit resets every hour</li>
								</ul>
							</div>
						</div>
					{/if}

					<div
						class="mt-6 card-actions flex flex-col gap-3 sm:flex-row"
					>
						<a href="/contacts/import/github" class="btn btn-primary">
							Try Again
						</a>
						<a href="/contacts" class="btn btn-outline btn-ghost">
							Back to Contacts
						</a>
						{#if status === 401}
							<a
								href="/contacts/import/github"
								class="btn btn-secondary"
							>
								Reconnect GitHub
							</a>
						{/if}
					</div>

					<div class="mt-6 text-left text-sm text-base-content/60">
						<p class="mb-2 font-semibold">Troubleshooting Tips:</p>
						<ul class="ml-4 list-disc space-y-1">
							{#if status === 401}
								<li>
									Make sure you granted the "user:follow" permission
								</li>
								<li>
									Try disconnecting and reconnecting your GitHub
									account
								</li>
							{:else if status === 403}
								<li>Wait 10-15 minutes before trying again</li>
								<li>
									Consider importing fewer contacts at once to reduce
									API usage
								</li>
							{:else if status === 503}
								<li>
									Check <a
										href="https://www.githubstatus.com"
										target="_blank"
										rel="noopener noreferrer"
										class="link">GitHub Status</a
									> for ongoing incidents
								</li>
								<li>Try again in a few minutes</li>
							{:else}
								<li>Refresh the page and try again</li>
								<li>
									If the problem persists, contact support with error
									code: {status}
								</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
