<script lang="ts">
	import { Button } from '#lib/components/ui/index.ts';

	interface Props {
		message: string;
		action_href?: string;
		action_text?: string;
	}

	let { message, action_href, action_text }: Props = $props();
</script>

<div class="py-12 text-center">
	<p class="text-lg opacity-70">{message}</p>
	{#if action_href && action_text}
		<div class="mt-4 inline-flex">
			<Button href={action_href} variant="primary">
				{action_text}
			</Button>
		</div>
	{/if}
</div>
