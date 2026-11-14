<script lang="ts">
	import type { AttachmentFn } from '#lib/utils/keyboard-attachments.ts';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		class_name?: string;
		validator?: boolean;
		attachment?: AttachmentFn;
	}

	let {
		type = 'text',
		value = $bindable(),
		class: wrapperClass = '',
		class_name = '',
		validator = false,
		attachment = undefined,
		...restProps
	}: Props = $props();

	const base_wrapper_classes = 'input w-full';
	const wrapper_classes = $derived(
		[
			validator
				? `validator ${base_wrapper_classes}`
				: base_wrapper_classes,
			wrapperClass,
		]
			.filter(Boolean)
			.join(' '),
	);

	const input_classes = $derived(
		['grow', class_name].filter(Boolean).join(' '),
	);
</script>

<label class={wrapper_classes}>
	<input
		{type}
		bind:value
		class={input_classes}
		{@attach attachment}
		{...restProps}
	/>
</label>
