<script lang="ts">
	import { goto } from '$app/navigation';
	import BackToTop from '$lib/components/back-to-top.svelte';
	import BottomNavDock from '$lib/components/bottom-nav-dock.svelte';
	import { nav_items } from '$lib/config/navigation';
	import { Sparkles } from '$lib/icons';
	import Logo from '$lib/logo.svelte';
	import { generate_qr_code_data_url } from '$lib/utils/qr-code';
	import { onDestroy, onMount } from 'svelte';
	import { get_current_user, logout } from '../auth.remote';
	import { ensure_profile, is_demo_user } from './layout.remote';
	import {
		get_profile_qr_url,
		get_user_qr_code,
		save_qr_code,
	} from './profile/profile.remote';

	let { children } = $props();

	let countdown_text = $state('');
	let is_warning = $state(false);
	let countdown_interval: ReturnType<typeof setInterval> | null =
		null;

	async function handle_logout() {
		await logout();
		goto('/login');
	}

	// Calculate time until next reset (resets at :00 and :30)
	function calculate_next_reset() {
		const now = new Date();
		const current_minutes = now.getMinutes();
		const next_reset = new Date(now);

		// If current time is before :30, next reset is at :30
		// If current time is at or after :30, next reset is at :00 of next hour
		if (current_minutes < 30) {
			next_reset.setMinutes(30, 0, 0);
		} else {
			next_reset.setHours(next_reset.getHours() + 1, 0, 0, 0);
		}

		return next_reset;
	}

	// Update countdown display
	function update_countdown() {
		const now = new Date();
		const next_reset = calculate_next_reset();
		const diff = next_reset.getTime() - now.getTime();

		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);

		// Set warning state when 5 minutes or less remaining
		is_warning = minutes <= 5;

		if (minutes > 0) {
			countdown_text = `${minutes} min ${seconds} sec`;
		} else if (seconds > 0) {
			countdown_text = `${seconds} sec`;
		} else {
			countdown_text = 'now';
		}
	}

	// Auto-generate QR code if user doesn't have one
	onMount(async () => {
		try {
			// Wait for profile to be ensured first
			await ensure_profile();

			const qr_url = await get_user_qr_code();
			if (!qr_url) {
				// Generate QR code silently in background
				const profile_url = await get_profile_qr_url();
				const data_url = await generate_qr_code_data_url(profile_url);
				await save_qr_code({ qr_code_url: data_url });
			}
		} catch (error) {
			// Silent fail - users can generate manually in settings
			console.error('Failed to auto-generate QR code:', error);
		}

		// Start countdown timer for demo users
		update_countdown();
		countdown_interval = setInterval(update_countdown, 1000);
	});

	onDestroy(() => {
		if (countdown_interval) {
			clearInterval(countdown_interval);
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<svelte:boundary>
	{#await ensure_profile()}
		<div class="flex min-h-screen items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:then}
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
									tabindex="0"
									class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
								>
									<li class="menu-title">
										<span>{user.name}</span>
									</li>
									{#each nav_items as item}
										<li><a href={item.href}>{item.label}</a></li>
									{/each}
									<li>
										<button onclick={handle_logout}>Logout</button>
									</li>
								</ul>
							</div>
						{/if}
					{/await}
				</div>
			</div>

			<!-- Demo mode banner -->
			{#await is_demo_user() then is_demo}
				{#if is_demo}
					<div class="border-y border-info bg-info py-4">
						<div
							class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8 lg:px-10"
						>
							<div class="flex items-center gap-3">
								<Sparkles
									size="24px"
									class_names="text-info-content"
									gradient={true}
								/>
								<div>
									<p class="font-semibold text-info-content">
										You're in demo mode
									</p>
									<p
										class="text-sm text-info-content {is_warning
											? 'font-bold'
											: 'opacity-80'}"
									>
										Resets in
										<span class="text-warning">
											{countdown_text}.
										</span>
										Create an account to add your own contacts.
									</p>
								</div>
								<Sparkles
									size="24px"
									class_names="text-info-content"
									gradient={true}
								/>
							</div>
							<a
								href="/register"
								class="btn gap-2 btn-sm btn-primary hover:scale-105"
							>
								Sign Up Free
							</a>
						</div>
					</div>
				{/if}
			{/await}

			<main
				class="mx-auto max-w-6xl p-4 pb-20 sm:p-6 md:p-8 lg:p-10 lg:pb-10"
			>
				{@render children()}
			</main>

			<BackToTop />
			<BottomNavDock />
		</div>
	{/await}

	{#snippet pending()}
		<div class="flex min-h-screen items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{/snippet}

	{#snippet failed(error: unknown, reset: () => void)}
		<div class="flex min-h-screen items-center justify-center">
			<div class="alert max-w-md alert-error">
				<span
					>Error: {error instanceof Error
						? error.message
						: String(error)}</span
				>
				<button class="btn btn-sm" onclick={reset}>Retry</button>
			</div>
		</div>
	{/snippet}
</svelte:boundary>
