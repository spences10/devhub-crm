<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import { Field, Input, Select } from '#lib/components/ui/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import { themes } from '#lib/themes/index.ts';
	import { format_date } from '#lib/utils/date-helpers.ts';
	import { Head } from 'svead';
	import { onMount } from 'svelte';
	import InteractionTypesManager from './interaction-types-manager.svelte';
	import { get_interaction_types } from './interaction-types.remote';
	import RadioGroupSetting from './radio-group-setting.svelte';
	import {
		get_user_preferences,
		update_date_format,
		update_default_contact_sort,
		update_default_follow_up_days,
		update_default_interaction_type,
		update_time_format,
	} from './settings.remote';
	import ThemePreview from './theme-preview.svelte';

	const today = new Date();
	const preferences = get_user_preferences();
	const interaction_types = get_interaction_types();

	let saving = $state(false);
	let current_theme = $state('');

	onMount(async () => {
		// Load theme from localStorage
		const theme = window.localStorage.getItem('theme');
		if (theme && themes.includes(theme)) {
			document.documentElement.setAttribute('data-theme', theme);
			current_theme = theme;
		}
	});

	async function save_with_indicator(fn: () => Promise<void>) {
		saving = true;
		await fn();
		await preferences.refresh();
		setTimeout(() => (saving = false), 500);
	}

	function set_theme(event: Event) {
		const select = event.target as HTMLSelectElement;
		const theme = select.value;
		if (themes.includes(theme)) {
			const one_year = 60 * 60 * 24 * 365;
			window.localStorage.setItem('theme', theme);
			document.cookie = `theme=${theme}; max-age=${one_year}; path=/; SameSite=Lax`;
			document.documentElement.setAttribute('data-theme', theme);
			current_theme = theme;
		}
	}

	// Define options
	const date_formats = [
		{
			value: 'YYYY-MM-DD',
			label: 'YYYY-MM-DD',
			example: () => format_date(today, 'YYYY-MM-DD') + ' (ISO 8601)',
		},
		{
			value: 'MM/DD/YYYY',
			label: 'MM/DD/YYYY',
			example: () =>
				format_date(today, 'MM/DD/YYYY') + ' (US format)',
		},
		{
			value: 'DD/MM/YYYY',
			label: 'DD/MM/YYYY',
			example: () =>
				format_date(today, 'DD/MM/YYYY') + ' (European format)',
		},
	];

	const time_formats = [
		{ value: '24h', label: '24-hour', example: 'Example: 14:30' },
		{ value: '12h', label: '12-hour', example: 'Example: 2:30 PM' },
	];

	const contact_sort_options = [
		{ value: 'name', label: 'Name (A-Z)' },
		{ value: 'last_contacted', label: 'Last Contacted' },
		{ value: 'recently_added', label: 'Recently Added' },
		{ value: 'company', label: 'Company (A-Z)' },
	];
</script>

<Head seo_config={seo_configs.settings} />

<div class="mb-8 flex items-center justify-between">
	<div>
		<h1 class="text-3xl font-bold">Settings</h1>
	</div>
	{#if saving}
		<span class="badge badge-lg badge-success">Saving...</span>
	{/if}
</div>
<PageNav />

{#await preferences}
	<div class="flex justify-center">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:then preferences_data}
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Theme Selector -->
		<BaseCard>
			{#snippet children()}
				<h2 class="card-title">Theme</h2>
				<p class="text-sm opacity-70">
					Choose a color theme for the application
				</p>

				<div class="mt-4">
					<Field legend="Choose Theme">
						<Select
							bind:value={current_theme}
							name="theme"
							onchange={set_theme}
						>
							<option value="" disabled={current_theme !== ''}>
								Choose a theme
							</option>
							{#each themes as theme}
								<option value={theme} class="capitalize"
									>{theme}</option
								>
							{/each}
						</Select>
					</Field>
				</div>

				<ThemePreview {current_theme} />
			{/snippet}
		</BaseCard>

		<RadioGroupSetting
			title="Date Format"
			description="Choose how dates are displayed throughout the application"
			name="date_format"
			options={date_formats}
			current={preferences_data.date_format}
			onchange={(value) =>
				save_with_indicator(() => update_date_format(value))}
			{saving}
		/>

		<RadioGroupSetting
			title="Time Format"
			description="Choose how times are displayed"
			name="time_format"
			options={time_formats}
			current={preferences_data.time_format}
			onchange={(value) =>
				save_with_indicator(() => update_time_format(value))}
			{saving}
		/>

		<RadioGroupSetting
			title="Default Contact Sort"
			description="How contacts are sorted by default"
			name="default_contact_sort"
			options={contact_sort_options}
			current={preferences_data.default_contact_sort}
			onchange={(value) =>
				save_with_indicator(() => update_default_contact_sort(value))}
			{saving}
		/>

		<!-- Default Follow-up Offset -->
		<BaseCard>
			{#snippet children()}
				<h2 class="card-title">Default Follow-up Offset</h2>
				<p class="text-sm opacity-70">
					When creating follow-ups, auto-set due date to this many
					days from today
				</p>

				<div class="mt-4 flex items-center gap-2">
					<Field legend="Days from today">
						<Input
							type="number"
							name="default_follow_up_days"
							min={1}
							max={90}
							value={preferences_data.default_follow_up_days}
							onchange={(e) =>
								save_with_indicator(() =>
									update_default_follow_up_days(
										Number(e.currentTarget.value),
									),
								)}
						/>
					</Field>
					<span class="ml-2 text-sm opacity-60">days</span>
				</div>
			{/snippet}
		</BaseCard>

		<!-- Default Interaction Type -->
		<BaseCard>
			{#snippet children()}
				<h2 class="card-title">Default Interaction Type</h2>
				<p class="text-sm opacity-70">
					Pre-select this interaction type when logging new
					interactions
				</p>

				<div class="mt-4">
					<Field legend="Default type">
						{#await interaction_types}
							<Select disabled name="default_interaction_type">
								<option>Loading...</option>
							</Select>
						{:then types}
							<Select
								name="default_interaction_type"
								value={preferences_data.default_interaction_type ||
									''}
								onchange={(e) =>
									save_with_indicator(() =>
										update_default_interaction_type(
											e.currentTarget.value || '',
										),
									)}
							>
								<option value="">None (no default)</option>
								{#each types as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</Select>
						{/await}
					</Field>
				</div>
			{/snippet}
		</BaseCard>

		<InteractionTypesManager {interaction_types} />
	</div>
{:catch error}
	<div class="alert alert-error">
		<span>Failed to load settings: {error.message}</span>
	</div>
{/await}
