<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import { Lightbulb } from '#lib/icons/index.ts';

	interface Props {
		notes: string | null;
	}

	let { notes }: Props = $props();
</script>

{#if notes}
	<BaseCard icon={Lightbulb} title="Notes">
		{#snippet children()}
			<p class="text-sm whitespace-pre-wrap">
				{notes}
			</p>
		{/snippet}
	</BaseCard>
{/if}
