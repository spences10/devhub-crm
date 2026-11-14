<script lang="ts">
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { Button } from '#lib/components/ui/index.ts';
	import Logo from '#lib/logo.svelte';
	import {
		get_error_description,
		get_error_title,
	} from '#lib/utils/error-messages.ts';

	const status = $derived(page.status);
	const message = $derived(
		get_error_title(status, page.error?.message),
	);
	const description = $derived(get_error_description(status));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{status} - {message} | DevHub CRM</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-base-200 p-4"
>
	<div class="mb-8">
		<Logo />
	</div>

	<div class="card w-full max-w-lg bg-base-100 shadow-xl">
		<div class="card-body items-center text-center">
			<div class="mb-4 text-6xl font-bold text-error">
				{status}
			</div>

			<h1 class="card-title text-2xl">
				{message}
			</h1>

			<p class="text-base-content/70">
				{description}
			</p>

			<div class="mt-6 card-actions flex flex-col gap-2 sm:flex-row">
				<Button href="/" variant="primary">Go to Home</Button>
				<Button href="/dashboard" variant="outline">
					Go to Dashboard
				</Button>
			</div>

			{#if status === 404}
				<div class="mt-4 text-sm text-base-content/50">
					If you think this page should exist, please contact support.
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-8 text-center text-sm text-base-content/50">
		<a href="/" class="link link-hover">
			&larr; Back to DevHub CRM
		</a>
	</div>
</div>
