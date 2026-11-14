<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import { GitHub } from '#lib/icons/index.ts';

	interface Props {
		github_username: string | null;
	}

	let { github_username }: Props = $props();
</script>

{#if github_username}
	<BaseCard
		icon={GitHub}
		title="GitHub Profile"
		variant="gradient"
		card_class="overflow-hidden"
	>
		{#snippet children()}
			<div class="space-y-3">
				<a
					href="https://github.com/{github_username}"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-block gap-2 btn-outline"
				>
					<GitHub size="20px" />
					@{github_username}
				</a>
				<p class="text-xs opacity-70">
					View their repositories, contributions, and activity on
					GitHub
				</p>
			</div>
		{/snippet}
	</BaseCard>
{/if}
