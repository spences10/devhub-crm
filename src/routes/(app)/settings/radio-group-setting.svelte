<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';

	interface Option {
		value: string;
		label: string;
		example?: string | (() => string);
	}

	interface Props {
		title: string;
		description: string;
		name: string;
		options: Option[];
		current: string;
		onchange: (value: string) => Promise<void>;
		saving?: boolean;
	}

	let {
		title,
		description,
		name,
		options,
		current,
		onchange,
		saving = false,
	}: Props = $props();

	async function handle_change(value: string) {
		if (!saving) {
			await onchange(value);
		}
	}
</script>

<BaseCard>
	{#snippet children()}
		<h2 class="card-title">{title}</h2>
		<p class="text-sm opacity-70">{description}</p>

		<div class="mt-4 space-y-3">
			{#each options as option}
				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="radio"
						{name}
						value={option.value}
						class="radio radio-primary"
						checked={current === option.value}
						onchange={() => handle_change(option.value)}
						disabled={saving}
					/>
					<div class="flex flex-col">
						<span class="font-medium">{option.label}</span>
						{#if option.example}
							<span class="text-sm opacity-60">
								{typeof option.example === 'function'
									? option.example()
									: option.example}
							</span>
						{/if}
					</div>
				</label>
			{/each}
		</div>
	{/snippet}
</BaseCard>
