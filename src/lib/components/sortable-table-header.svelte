<script lang="ts" generics="T extends string">
	import { Arrow } from '#lib/icons/index.ts';

	interface Props {
		label: string;
		column: T;
		current_sort: T;
		sort_direction: 'asc' | 'desc';
		on_toggle: (column: T) => void;
		center?: boolean;
		class_names?: string;
	}

	let {
		label,
		column,
		current_sort,
		sort_direction,
		on_toggle,
		center = false,
		class_names = '',
	}: Props = $props();

	const aria_label = $derived(
		current_sort === column
			? `Sort by ${label} ${sort_direction === 'asc' ? 'descending' : 'ascending'}`
			: `Sort by ${label}`,
	);
</script>

<th class="p-0 {center ? 'text-center' : ''} {class_names}">
	<button
		onclick={() => on_toggle(column)}
		class="flex w-full items-center gap-1 px-4 py-3 hover:underline {center
			? 'justify-center'
			: ''}"
		aria-label={aria_label}
	>
		{label}
		{#if current_sort === column}
			<Arrow
				size="16px"
				direction={sort_direction === 'asc' ? 'up' : 'down'}
			/>
		{/if}
	</button>
</th>
