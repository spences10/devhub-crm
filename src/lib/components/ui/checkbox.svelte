<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<
		HTMLInputAttributes,
		'type' | 'checked'
	> {
		checked?: boolean;
		label?: string;
		class_name?: string;
	}

	let {
		checked = $bindable(false),
		class: className = '',
		class_name = '',
		label = '',
		...restProps
	}: Props = $props();

	const base_classes = 'checkbox';
	const computed_classes = $derived(
		[base_classes, class_name, className].filter(Boolean).join(' '),
	);
</script>

{#if label}
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="checkbox"
			bind:checked
			class={computed_classes}
			{...restProps}
		/>
		<span>{label}</span>
	</label>
{:else}
	<input
		type="checkbox"
		bind:checked
		class={computed_classes}
		{...restProps}
	/>
{/if}
