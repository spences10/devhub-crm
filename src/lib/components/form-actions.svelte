<script lang="ts">
	import { Button } from '#lib/components/ui/index.ts';

	interface Props {
		submit_text: string;
		cancel_href: string;
		submitting?: boolean;
		submit_variant?:
			| 'primary'
			| 'outline'
			| 'ghost'
			| 'error'
			| 'success';
		submit_class?: string;
	}

	let {
		submit_text,
		cancel_href,
		submitting = false,
		submit_variant = 'primary',
		submit_class = 'flex-1',
	}: Props = $props();
</script>

<div class="flex gap-4">
	<Button
		type="submit"
		variant={submit_variant}
		class={submit_class}
		disabled={submitting}
	>
		{submitting ? 'Saving...' : submit_text}
	</Button>
	<a href={cancel_href} class="inline-block">
		<Button variant="ghost">Cancel</Button>
	</a>
</div>
