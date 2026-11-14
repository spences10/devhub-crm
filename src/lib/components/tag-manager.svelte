<script lang="ts">
	import { Refresh, Trash } from '#lib/icons/index.ts';
	import type { Tag } from '#lib/types/db.ts';
	import ConfirmDialog from './confirm-dialog.svelte';
	import Surface from './surface.svelte';
	import { Button, Field, Input } from './ui';

	interface Props {
		contact_tags: Tag[];
		available_tags: Tag[];
		on_add_tag: (tag_id: string) => Promise<void>;
		on_remove_tag: (tag_id: string) => Promise<void>;
		on_create_tag: (name: string, color: string) => Promise<void>;
	}

	let {
		contact_tags,
		available_tags,
		on_add_tag,
		on_remove_tag,
		on_create_tag,
	}: Props = $props();

	// GitHub default color palette
	const DEFAULT_COLORS = [
		'#b60205', // Red
		'#d93f0b', // Orange
		'#fbca04', // Yellow
		'#0e8a16', // Green
		'#006b75', // Teal
		'#1d76db', // Blue
		'#0052cc', // Dark Blue
		'#5319e7', // Purple
		'#e99695', // Light Red
		'#f9d0c4', // Light Orange
		'#fef2c0', // Light Yellow
		'#c2e0c6', // Light Green
		'#bfdadc', // Light Teal
		'#c5def5', // Light Blue
		'#bfd4f2', // Light Dark Blue
		'#d4c5f9', // Light Purple
	];

	let new_tag_name = $state('');
	let selected_color = $state(DEFAULT_COLORS[0]);
	let custom_color = $state('');
	let use_custom_color = $state(false);
	let adding_tag = $state(false);
	let show_create_form = $state(false);
	let delete_confirmation_id = $state<string | null>(null);

	// Available tags that aren't already assigned
	let unassigned_tags = $derived(
		available_tags.filter(
			(tag) => !contact_tags.some((ct) => ct.id === tag.id),
		),
	);

	function generate_random_color() {
		const random_hex = Math.floor(Math.random() * 16777215)
			.toString(16)
			.padStart(6, '0');
		return `#${random_hex}`;
	}

	function handle_random_color() {
		const random = generate_random_color();
		if (use_custom_color) {
			custom_color = random;
		} else {
			selected_color = random;
			use_custom_color = true;
			custom_color = random;
		}
	}

	async function handle_create_tag() {
		if (!new_tag_name.trim()) return;

		const color = use_custom_color ? custom_color : selected_color;

		// Validate color format
		if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
			alert('Please enter a valid hex color (e.g., #ff5733)');
			return;
		}

		adding_tag = true;
		try {
			await on_create_tag(new_tag_name.trim(), color);
			new_tag_name = '';
			selected_color = DEFAULT_COLORS[0];
			custom_color = '';
			use_custom_color = false;
			show_create_form = false;
		} catch (err: any) {
			alert(err.message || 'Failed to create tag');
		} finally {
			adding_tag = false;
		}
	}

	async function handle_add_existing_tag(tag_id: string) {
		try {
			await on_add_tag(tag_id);
		} catch (err: any) {
			alert(err.message || 'Failed to add tag');
		}
	}

	function handle_remove_click(tag_id: string) {
		delete_confirmation_id = tag_id;
	}

	async function confirm_remove() {
		if (!delete_confirmation_id) return;

		try {
			await on_remove_tag(delete_confirmation_id);
			delete_confirmation_id = null;
		} catch (err: any) {
			alert(err.message || 'Failed to remove tag');
		}
	}

	function cancel_remove() {
		delete_confirmation_id = null;
	}
</script>

<Surface>
	<p class="mb-3 text-sm font-medium">Tags</p>

	<!-- Assigned Tags -->
	{#if contact_tags && contact_tags.length > 0}
		<div class="mb-4 flex flex-wrap gap-2">
			{#each contact_tags as tag}
				<div
					class="badge gap-2 badge-lg"
					style="background-color: {tag.color}; color: white; border: none;"
				>
					<span>{tag.name}</span>
					{#if delete_confirmation_id === tag.id}
						<ConfirmDialog
							is_inline={true}
							message="Remove?"
							on_confirm={confirm_remove}
							on_cancel={cancel_remove}
						/>
					{:else}
						<Button
							type="button"
							variant="ghost"
							size="xs"
							class="size-4 min-h-0 p-0"
							onclick={() => handle_remove_click(tag.id)}
							aria-label="Remove tag"
						>
							<Trash size="12px" class_names="text-white" />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add Existing Tags -->
	{#if unassigned_tags.length > 0}
		<div class="mb-3">
			<p class="mb-2 text-xs font-medium opacity-70">
				Add existing tag
			</p>
			<div class="flex flex-wrap gap-2">
				{#each unassigned_tags as tag}
					<button
						type="button"
						onclick={() => handle_add_existing_tag(tag.id)}
						class="badge badge-outline badge-lg hover:scale-105"
						style="border-color: {tag.color}; color: {tag.color};"
					>
						{tag.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Create New Tag -->
	<div class="space-y-3">
		{#if !show_create_form}
			<Button
				variant="outline"
				size="sm"
				onclick={() => (show_create_form = true)}
				class="btn-block"
			>
				Create New Tag
			</Button>
		{:else}
			<div class="rounded-box border border-base-300 bg-base-100 p-4">
				<p class="mb-3 text-xs font-medium opacity-70">
					Create new tag
				</p>

				<!-- Tag Name -->
				<div class="mb-3">
					<Field legend="Tag Name">
						<Input
							type="text"
							name="tag_name"
							placeholder="e.g., Client, Lead, Partner"
							bind:value={new_tag_name}
							maxlength={30}
						/>
					</Field>
				</div>

				<!-- Color Selection -->
				<div class="mb-3">
					<p class="mb-2 text-xs font-medium">Color</p>

					<!-- Preset Colors Grid -->
					<div class="mb-3 grid grid-cols-8 gap-2">
						{#each DEFAULT_COLORS as color}
							<button
								type="button"
								onclick={() => {
									selected_color = color;
									use_custom_color = false;
								}}
								class="size-8 rounded border-2 transition-transform hover:scale-110 {selected_color ===
									color && !use_custom_color
									? 'border-primary ring-2 ring-primary ring-offset-2'
									: 'border-base-300'}"
								style="background-color: {color};"
								aria-label="Select color {color}"
							></button>
						{/each}
					</div>

					<!-- Custom Color & Random Button -->
					<div class="flex gap-2">
						<div class="flex-1">
							<Field legend="Custom Hex">
								<div class="flex items-center gap-2">
									<Input
										type="text"
										name="custom_color"
										placeholder="#ff5733"
										bind:value={custom_color}
										onfocus={() => (use_custom_color = true)}
										maxlength={7}
									/>
									{#if use_custom_color && custom_color}
										<div
											class="size-6 rounded border border-base-300"
											style="background-color: {custom_color};"
										></div>
									{/if}
								</div>
							</Field>
						</div>
						<Button
							variant="outline"
							onclick={handle_random_color}
							class="tooltip"
							data-tip="Random color"
							aria-label="Generate random color"
						>
							<Refresh size="20px" />
						</Button>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onclick={() => {
							show_create_form = false;
							new_tag_name = '';
							selected_color = DEFAULT_COLORS[0];
							custom_color = '';
							use_custom_color = false;
						}}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onclick={handle_create_tag}
						disabled={adding_tag || !new_tag_name.trim()}
						loading={adding_tag}
						class="flex-1"
					>
						Create
					</Button>
				</div>
			</div>
		{/if}
	</div>
</Surface>
