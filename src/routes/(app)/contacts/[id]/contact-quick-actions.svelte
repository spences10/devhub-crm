<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import type { Component } from 'svelte';

	interface ActionCard {
		href: string | null;
		icon: Component;
		icon_color: string;
		title: string;
		title_short: string;
		description: string;
		enabled: boolean;
	}

	interface Props {
		action_cards: ActionCard[];
	}

	let { action_cards }: Props = $props();
</script>

<div class="mb-6 flex gap-2 md:gap-4">
	{#each action_cards as action}
		{@const additional_classes = `tooltip flex-1 border border-base-300 ${
			action.enabled
				? 'transition-shadow duration-200 hover:shadow-lg'
				: 'cursor-not-allowed opacity-50'
		}`}

		{#if action.enabled}
			<a
				href={action.href}
				class={additional_classes}
				data-tip={action.description}
			>
				<BaseCard body_class="items-center p-4 text-center md:p-6">
					{#snippet children()}
						<div class="mb-2 md:mb-3">
							<action.icon
								size="28px"
								class_names={action.icon_color}
							/>
						</div>
						<h3
							class="card-title justify-center text-xs font-semibold opacity-70"
						>
							<span class="md:hidden">{action.title_short}</span>
							<span class="hidden md:inline">{action.title}</span>
						</h3>
						<p class="hidden text-xs opacity-70 md:block">
							{action.description}
						</p>
					{/snippet}
				</BaseCard>
			</a>
		{:else}
			<div class={additional_classes} data-tip={action.description}>
				<BaseCard body_class="items-center p-4 text-center md:p-6">
					{#snippet children()}
						<div class="mb-2 md:mb-3">
							<action.icon
								size="28px"
								class_names={action.icon_color}
							/>
						</div>
						<h3
							class="card-title justify-center text-xs font-semibold opacity-70"
						>
							<span class="md:hidden">{action.title_short}</span>
							<span class="hidden md:inline">{action.title}</span>
						</h3>
						<p class="hidden text-xs opacity-70 md:block">
							{action.description}
						</p>
					{/snippet}
				</BaseCard>
			</div>
		{/if}
	{/each}
</div>
