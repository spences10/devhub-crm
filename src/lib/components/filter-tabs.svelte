<script lang="ts" generics="T extends string">
	interface Props {
		options: readonly T[];
		active_filter: T;
		on_filter_change: (filter: T) => void;
	}

	let { options, active_filter, on_filter_change }: Props = $props();
</script>

<div class="tabs-box mb-6 tabs">
	{#each options as option}
		<button
			type="button"
			class="tab {active_filter === option ? 'tab-active' : ''}"
			onclick={() => on_filter_change(option)}
		>
			{option.charAt(0).toUpperCase() + option.slice(1)}
		</button>
	{/each}
</div>
