<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
	import { Button, Field, Input } from '#lib/components/ui/index.ts';
	import Logo from '#lib/logo.svelte';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import { Turnstile } from 'svelte-turnstile';
	import { forgot_password } from '../../auth.remote';

	const mode = page.url.searchParams.get('mode');
	const is_setup = mode === 'setup';
	const prefilled_email = page.url.searchParams.get('email') || '';

	let turnstile_token = $state('');
</script>

<Head seo_config={seo_configs.forgotPassword} />

<div class="mb-8 flex justify-center">
	<a href="/">
		<Logo size="70px" />
	</a>
</div>

<h2 class="mb-6 text-center text-2xl font-bold">
	{is_setup ? 'Set up your password' : 'Reset your password'}
</h2>

<p class="mb-6 text-center text-sm text-base-content/70">
	{is_setup
		? "Enter your email address and we'll send you a link to set up password authentication."
		: "Enter your email address and we'll send you a link to reset your password."}
</p>

<form {...forgot_password} class="space-y-4">
	<Field
		legend="Email"
		helper_text={is_setup && prefilled_email
			? 'To use a different email, update it in your profile settings first.'
			: ''}
	>
		<Input
			{...forgot_password.fields.email.as('email')}
			placeholder="Email"
			value={prefilled_email}
			disabled={is_setup && !!prefilled_email}
			required
			validator
		/>
	</Field>

	<input
		{...forgot_password.fields.turnstile_token.as(
			'hidden',
			turnstile_token,
		)}
	/>

	<div class="mb-0 flex justify-center">
		<Turnstile
			size="flexible"
			theme="auto"
			siteKey={PUBLIC_TURNSTILE_SITE_KEY}
			on:turnstile-callback={(e) => {
				turnstile_token = e.detail.token;
			}}
		/>
	</div>

	<Button
		disabled={!turnstile_token}
		type="submit"
		variant="primary"
		size="block"
		class="mt-6"
	>
		{is_setup ? 'Send setup link' : 'Send reset link'}
	</Button>
</form>

<div class="divider">or</div>

<p class="text-center">
	Remember your password?
	<a href="/login" class="link link-primary">Sign in</a>
</p>
