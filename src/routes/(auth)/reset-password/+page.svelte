<script lang="ts">
	import { page } from '$app/state';
	import { Button, Field, Input } from '#lib/components/ui/index.ts';
	import Logo from '#lib/logo.svelte';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import { reset_password } from '../../auth.remote';

	// Get token from URL query parameter
	const token = $derived(page.url.searchParams.get('token') || '');
</script>

<Head seo_config={seo_configs.resetPassword} />

<div class="mb-8 flex justify-center">
	<Logo size="70px" />
</div>

<h2 class="mb-6 text-center text-2xl font-bold">
	Create new password
</h2>

<p class="mb-6 text-center text-sm text-base-content/70">
	Enter your new password below.
</p>

{#if !token}
	<div class="alert alert-error">
		<span>
			Invalid or missing reset token. Please request a new password
			reset link.
		</span>
	</div>
	<div class="mt-4 text-center">
		<a href="/forgot-password" class="link link-primary">
			Request new link
		</a>
	</div>
{:else}
	<form {...reset_password} class="space-y-4">
		<input {...reset_password.fields.token.as('hidden', token)} />

		<Field
			legend="New Password"
			helper_text="Must be at least 8 characters"
		>
			<Input
				{...reset_password.fields.password.as('password')}
				placeholder="New password"
				required
				validator
				minlength={8}
			/>
		</Field>

		<Button type="submit" variant="primary" size="block" class="mt-6">
			Reset password
		</Button>
	</form>

	<div class="divider">or</div>

	<p class="text-center">
		Remember your password?
		<a href="/login" class="link link-primary">Sign in</a>
	</p>
{/if}
