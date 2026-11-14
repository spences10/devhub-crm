<script lang="ts">
	import type { AttachmentFn } from '#lib/utils/keyboard-attachments.ts';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends HTMLTextareaAttributes {
		value?: string;
		rows?: number;
		class_name?: string;
		attachment?: AttachmentFn;
	}

	let {
		value = $bindable(''),
		rows = 4,
		class: className = '',
		class_name = '',
		attachment = undefined,
		...restProps
	}: Props = $props();

	const base_classes = 'textarea w-full';
	const computed_classes = $derived(
		[base_classes, class_name, className].filter(Boolean).join(' '),
	);
</script>

<textarea
	bind:value
	{rows}
	class={computed_classes}
	{@attach attachment}
	{...restProps}></textarea>
