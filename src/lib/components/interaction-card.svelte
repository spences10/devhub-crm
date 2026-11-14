<script lang="ts">
	import CompactItem from '#lib/components/compact-item.svelte';
	import { type_badges } from '#lib/constants/badges.ts';
	import type { Interaction } from '#lib/types/db.ts';
	import {
		type DateFormat,
		format_date,
	} from '#lib/utils/date-helpers.ts';

	interface Props {
		interaction: Interaction & {
			contact_name?: string;
			contact_id?: string;
		};
		date_format: DateFormat;
		variant?: 'full' | 'compact';
	}

	let {
		interaction,
		date_format,
		variant = 'full',
	}: Props = $props();
</script>

{#if variant === 'compact'}
	<!-- Compact version (used in dashboard) -->
	<CompactItem
		href={interaction.contact_id
			? `/contacts/${interaction.contact_id}`
			: null}
		heading={interaction.contact_name}
		note={interaction.note}
	>
		{#snippet metadata()}
			<div class="flex items-center gap-2">
				<span class="badge badge-sm {type_badges[interaction.type]}">
					{interaction.type}
				</span>
				<span class="text-xs opacity-60">
					{format_date(new Date(interaction.created_at), date_format)}
				</span>
			</div>
		{/snippet}
	</CompactItem>
{:else}
	<!-- Full version (used in interactions list and contact detail) -->
	<CompactItem variant="default" href={null}>
		{#snippet header()}
			<div class="flex items-center gap-2">
				<span class="badge {type_badges[interaction.type]}">
					{interaction.type}
				</span>
				<span class="text-sm opacity-60">
					{format_date(new Date(interaction.created_at), date_format)}
				</span>
			</div>
		{/snippet}

		{#if interaction.note}
			{#snippet body()}
				<p class="text-sm whitespace-pre-wrap">
					{interaction.note}
				</p>
			{/snippet}
		{/if}
	</CompactItem>
{/if}
