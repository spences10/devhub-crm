<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import type { InteractionType } from '#lib/types/interaction-type.ts';
	import {
		get_color_name,
		get_icon_component,
	} from '#lib/utils/interaction-type-helpers.ts';
	import InteractionTypeModal from './interaction-type-modal.svelte';
	import {
		create_interaction_type,
		delete_interaction_type,
		update_interaction_type,
	} from './interaction-types.remote';

	interface Props {
		interaction_types: Promise<InteractionType[]>;
	}

	let { interaction_types }: Props = $props();

	// Modal state
	let show_type_modal = $state(false);
	let editing_type: InteractionType | null = $state(null);
	let form_value = $state('');
	let form_label = $state('');
	let form_icon = $state('Calendar');
	let form_color = $state('bg-primary text-primary-content');
	let form_loading = $state(false);
	let form_error = $state('');

	async function open_type_modal(type?: InteractionType) {
		if (type) {
			editing_type = type;
			form_value = type.value;
			form_label = type.label;
			form_icon = type.icon;
			form_color = type.color;
		} else {
			editing_type = null;
			form_value = '';
			form_label = '';
			form_icon = 'Calendar';
			form_color = 'bg-primary text-primary-content';
		}
		form_error = '';
		show_type_modal = true;
	}

	function close_type_modal() {
		show_type_modal = false;
		editing_type = null;
	}

	async function save_interaction_type() {
		form_loading = true;
		form_error = '';

		try {
			let result;
			if (editing_type) {
				result = await update_interaction_type({
					id: editing_type.id,
					label: form_label,
					icon: form_icon,
					color: form_color,
					display_order: editing_type.display_order,
				});
			} else {
				result = await create_interaction_type({
					value: form_value.toLowerCase().replace(/\s+/g, '_'),
					label: form_label,
					icon: form_icon,
					color: form_color,
					display_order: 0,
				});
			}

			if (result.error) {
				form_error = result.error;
			} else {
				close_type_modal();
				// Trigger refresh by re-evaluating the promise
				if (interaction_types instanceof Promise) {
					await interaction_types;
				}
			}
		} catch (error) {
			form_error = 'Failed to save type';
		} finally {
			form_loading = false;
		}
	}

	async function delete_type(type: InteractionType) {
		if (!confirm(`Delete "${type.label}"? This cannot be undone.`)) {
			return;
		}

		try {
			const result = await delete_interaction_type(type.id);
			if (result.error) {
				alert(`Error: ${result.error}`);
			} else {
				// Trigger refresh
				if (interaction_types instanceof Promise) {
					await interaction_types;
				}
			}
		} catch (error) {
			alert('Failed to delete type');
		}
	}
</script>

<BaseCard class="col-span-full">
	{#snippet children()}
		<div class="flex items-center justify-between">
			<div>
				<h2 class="card-title">Manage Interaction Types</h2>
				<p class="text-sm opacity-70">
					Create custom interaction types or edit existing ones
				</p>
			</div>
			<button
				type="button"
				class="btn btn-primary btn-sm"
				onclick={() => open_type_modal()}
			>
				Add New Type
			</button>
		</div>

		{#await interaction_types}
			<div class="flex justify-center py-8">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:then types}
			<!-- Desktop table view -->
			<div class="mt-4 hidden overflow-x-auto sm:block">
				<table class="table w-full">
					<thead>
						<tr>
							<th>Label</th>
							<th>Value</th>
							<th>Icon</th>
							<th>Color</th>
							<th>Type</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each types as type (type.id)}
							{@const IconComponent = get_icon_component(type.icon)}
							<tr class="hover">
								<td>
									<span class="font-medium">{type.label}</span>
								</td>
								<td>
									<code class="rounded bg-base-200 px-2 py-1 text-sm"
										>{type.value}</code
									>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<IconComponent class="h-5 w-5" />
										<span class="text-sm">{type.icon}</span>
									</div>
								</td>
								<td>
									<div class="badge {type.color} w-24 text-center">
										{get_color_name(type.color)}
									</div>
								</td>
								<td>
									{#if type.user_id}
										<span class="badge badge-secondary">Custom</span>
									{:else}
										<span class="badge">System</span>
									{/if}
								</td>
								<td>
									<div class="flex gap-2">
										{#if type.user_id}
											<button
												type="button"
												class="btn btn-ghost btn-xs"
												onclick={() => open_type_modal(type)}
											>
												Edit
											</button>
											<button
												type="button"
												class="btn btn-ghost text-error btn-xs"
												onclick={() => delete_type(type)}
											>
												Delete
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile card view -->
			<div class="mt-4 space-y-3 sm:hidden">
				{#each types as type (type.id)}
					{@const IconComponent = get_icon_component(type.icon)}
					<BaseCard
						background="bg-base-200"
						body_class="p-4"
						shadow="none"
					>
						{#snippet children()}
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1">
									<h3 class="font-bold">{type.label}</h3>
									<p class="text-xs opacity-70">
										<code>{type.value}</code>
									</p>
								</div>
								<div>
									{#if type.user_id}
										<span class="badge badge-sm badge-secondary"
											>Custom</span
										>
									{:else}
										<span class="badge badge-sm">System</span>
									{/if}
								</div>
							</div>

							<div class="divider my-2"></div>

							<div class="space-y-2 text-sm">
								<div class="flex items-center gap-2">
									<span class="font-medium">Icon:</span>
									<IconComponent class="h-5 w-5" />
									<span>{type.icon}</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="font-medium">Color:</span>
									<div class="badge {type.color} text-xs">
										{get_color_name(type.color)}
									</div>
								</div>
							</div>

							{#if type.user_id}
								<div class="mt-3 card-actions justify-end gap-2">
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => open_type_modal(type)}
									>
										Edit
									</button>
									<button
										type="button"
										class="btn btn-ghost text-error btn-sm"
										onclick={() => delete_type(type)}
									>
										Delete
									</button>
								</div>
							{/if}
						{/snippet}
					</BaseCard>
				{/each}
			</div>
		{:catch error}
			<div class="alert alert-error">
				<span>Failed to load interaction types</span>
			</div>
		{/await}
	{/snippet}
</BaseCard>

<InteractionTypeModal
	show={show_type_modal}
	editingType={editing_type}
	onSave={save_interaction_type}
	onClose={close_type_modal}
	{form_value}
	{form_label}
	{form_icon}
	{form_color}
	{form_loading}
	{form_error}
	onFormValueChange={(value) => (form_value = value)}
	onFormLabelChange={(label) => (form_label = label)}
	onFormIconChange={(icon) => (form_icon = icon)}
	onFormColorChange={(color) => (form_color = color)}
/>
