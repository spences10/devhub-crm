<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<
		HTMLInputAttributes,
		'type' | 'checked'
	> {
		name: string;
		value: string;
		checked?: boolean;
		label?: string;
		class_name?: string;
	}

	let {
		name,
		value,
		checked = false,
		class: className = '',
		class_name = '',
		label = '',
		...restProps
	}: Props = $props();

	const base_classes = 'radio radio-primary';
	const computed_classes = $derived(
		[base_classes, class_name, className].filter(Boolean).join(' '),
	);
</script>

{#if label}
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="radio"
			{name}
			{value}
			{checked}
			class={computed_classes}
			{...restProps}
		/>
		<span>{label}</span>
	</label>
{:else}
	<input
		type="radio"
		{name}
		{value}
		{checked}
		class={computed_classes}
		{...restProps}
	/>
{/if}
