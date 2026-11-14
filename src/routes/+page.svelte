<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Calendar,
		Contacts,
		Dashboard,
		GitHub,
	} from '#lib/icons/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import { demo_login, get_current_user } from './auth.remote';
	import Benefits from './benefits.svelte';
	import Features from './features.svelte';
	import FinalCta from './final-cta.svelte';
	import Footer from './footer.svelte';
	import Hero from './hero.svelte';
	import LoggedInWelcome from './logged-in-welcome.svelte';

	async function handle_demo_login() {
		const result = await demo_login();
		if (result.success) {
			goto('/dashboard');
		}
	}

	const features = [
		{
			icon: Contacts,
			title: 'Unlimited Contacts',
			description:
				'Manage all your developer relationships in one place. Import directly from GitHub.',
		},
		{
			icon: Dashboard,
			title: 'Track Interactions',
			description:
				'Log meetings, calls, and conversations. Never forget a conversation again.',
		},
		{
			icon: Calendar,
			title: 'Smart Follow-ups',
			description:
				'Automated reminders keep you connected. Never miss an important follow-up.',
		},
		{
			icon: GitHub,
			title: 'GitHub Integration',
			description:
				'Import contacts from your GitHub network. Auto-sync activity and relationships.',
		},
	];

	const benefits = [
		'GitHub-native relationship management',
		'CLI tool for terminal-first workflows',
		'Your data stays yours (SQLite, full export)',
		'Self-hostable and privacy-first',
		'AI-powered insights (coming soon)',
		'Public profiles with QR codes for conferences',
	];
</script>

<Head seo_config={seo_configs.home} />

{#await get_current_user() then user}
	{#if user}
		<LoggedInWelcome {user} />
	{:else}
		<div class="min-h-screen bg-base-100">
			<Hero on_demo_login={handle_demo_login} />
			<Features {features} />
			<Benefits {benefits} />
			<FinalCta on_demo_login={handle_demo_login} />
			<Footer />
		</div>
	{/if}
{/await}
