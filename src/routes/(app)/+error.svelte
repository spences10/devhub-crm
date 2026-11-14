<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/index.ts';
	import Logo from '#lib/logo.svelte';
	import {
		get_error_description,
		get_error_title,
	} from '#lib/utils/error-messages.ts';
	import { get_current_user } from '../auth.remote';

	const status = $derived(page.status);

	// App-specific overrides
	const app_messages: Record<number, string> = {
		401: 'Unauthorized - Please log in',
		403: 'Access Denied',
		404: 'Resource Not Found',
	};

	const app_descriptions: Record<number, string> = {
		400: 'The request could not be processed. Please check your input.',
		404: "The resource you're looking for doesn't exist or may have been removed.",
		500: 'Something went wrong on our end. Our team has been notified.',
		503: 'The service is temporarily unavailable. Please try again in a moment.',
	};

	const title = $derived(
		get_error_title(status, page.error?.message, app_messages),
	);
	const description = $derived(
		get_error_description(status, app_descriptions),
	);

	async function handle_logout() {
		const { logout } = await import('../auth.remote');
		await logout();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100 shadow-lg">
		<div class="flex-1">
			<a href="/dashboard" class="">
				<Logo />
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
							class="menu dropdown-content z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
						>
							<li class="menu-title">
								<span>{user.name}</span>
							</li>
							<li><a href="/dashboard">Dashboard</a></li>
							<li><a href="/contacts">Contacts</a></li>
							<li><a href="/settings">Settings</a></li>
							<li>
								<Button
									variant="ghost"
									size="sm"
									onclick={handle_logout}
								>
									Logout
								</Button>
							</li>
						</ul>
					</div>
				{/if}
			{/await}
		</div>
	</div>

	<main class="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 lg:p-10">
		<div
			class="flex min-h-[60vh] flex-col items-center justify-center"
		>
			<div class="card w-full max-w-2xl bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="mb-4 text-7xl font-bold text-error">
						{status}
					</div>

					<h1 class="card-title text-3xl">
						{title}
					</h1>

					<p class="mt-2 text-base-content/70">
						{description}
					</p>

					<div
						class="mt-8 card-actions flex flex-col gap-3 sm:flex-row"
					>
						<Button href="/dashboard" variant="primary">
							Go to Dashboard
						</Button>
						<Button href="/contacts" variant="outline">
							View Contacts
						</Button>
						{#if status === 401}
							<Button href="/login" variant="success">Log In</Button>
						{/if}
					</div>

					{#if status === 500}
						<div class="mt-6 alert alert-warning">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 shrink-0 stroke-current"
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
							<span>
								Our team has been automatically notified. We're
								working to fix this issue.
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>
