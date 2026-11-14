<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import type { Component } from 'svelte';

	interface StatCardData {
		icon: Component;
		icon_color: string;
		value: number | string;
		value_color: string;
		label: string;
		sublabel: string | null;
		sublabel_color: string;
	}

	interface Props {
		stats_cards: StatCardData[];
	}

	let { stats_cards }: Props = $props();
</script>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
	{#each stats_cards as stat}
		<BaseCard variant="stat" shadow="md" body_class="p-4">
			{#snippet children()}
				<div class="mb-2 flex items-center justify-center">
					<stat.icon size="28px" class_names={stat.icon_color} />
				</div>
				<div class="mb-1 text-2xl font-extrabold {stat.value_color}">
					{stat.value}
				</div>
				<div class="text-xs font-semibold opacity-70">
					{stat.label}
				</div>
				{#if stat.sublabel}
					<div class="text-xs {stat.sublabel_color}">
						{stat.sublabel}
					</div>
				{/if}
			{/snippet}
		</BaseCard>
	{/each}
</div>
