<script lang="ts">
	import { page } from '$app/state';
	import { auth_client } from '#lib/client/auth.ts';
	import { Button, Field, Input } from '#lib/components/ui/index.ts';
	import Github from '#lib/icons/github.svelte';
	import Logo from '#lib/logo.svelte';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import { login } from '../../auth.remote';

	const reset_success = $derived(
		page.url.searchParams.get('reset') === 'success',
	);

	async function handle_github_signin() {
		await auth_client.signIn.social({
			provider: 'github',
			callbackURL: '/dashboard',
		});
	}
</script>

<Head seo_config={seo_configs.login} />

<div class="mb-8 flex justify-center">
	<a href="/">
		<Logo size="70px" />
	</a>
</div>

<h2 class="mb-6 text-center text-2xl font-bold">Sign in to Devhub</h2>

{#if reset_success}
	<div class="mb-4 alert alert-success">
		<span>
			Your password has been reset successfully. Please sign in with
			your new password.
		</span>
	</div>
{/if}

<form {...login} class="space-y-4">
	<Field legend="Email">
		<Input
			{...login.fields.email.as('email')}
			placeholder="Email"
			required
			validator
		/>
	</Field>

	<Field legend="Password">
		<Input
			{...login.fields.password.as('password')}
			placeholder="Password"
			required
			validator
			minlength={8}
		/>
	</Field>

	<Button type="submit" variant="primary" size="block" class="mt-6">
		Login
	</Button>
</form>

<div class="divider">or</div>

<Button
	onclick={handle_github_signin}
	type="button"
	variant="outline"
	size="block"
	class="gap-2"
>
	<Github size="20px" />
	Continue with GitHub
</Button>

<div class="divider"></div>

<p class="mb-2 text-center">
	Don't have an account?
	<a href="/register" class="link link-info">Register</a>
</p>

<p class="text-center">
	Forgot your password?
	<a href="/forgot-password" class="link link-info">
		Reset it here
	</a>
</p>
