<script lang="ts">
	import ConfirmDialog from '#lib/components/confirm-dialog.svelte';
	import EmptyState from '#lib/components/empty-state.svelte';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import { Edit, Refresh, Tag, Trash } from '#lib/icons/index.ts';
	import {
		create_tag,
		delete_tag,
		get_tag_contacts,
		get_tags,
		update_tag,
	} from './tags.remote';

	// GitHub default color palette
	const DEFAULT_COLORS = [
		'#b60205',
		'#d93f0b',
		'#fbca04',
		'#0e8a16',
		'#006b75',
		'#1d76db',
		'#0052cc',
		'#5319e7',
		'#e99695',
		'#f9d0c4',
		'#fef2c0',
		'#c2e0c6',
		'#bfdadc',
		'#c5def5',
		'#bfd4f2',
		'#d4c5f9',
	];

	let show_create_form = $state(false);
	let delete_confirmation_id = $state<string | null>(null);
	let edit_tag_id = $state<string | null>(null);

	// Create form state
	let new_tag_name = $state('');
	let selected_color = $state(DEFAULT_COLORS[0]);
	let custom_color = $state('');
	let use_custom_color = $state(false);
	let creating_tag = $state(false);

	// Edit form state
	let edit_name = $state('');
	let edit_color = $state('');
	let edit_use_custom = $state(false);
	let edit_custom_color = $state('');
	let updating_tag = $state(false);

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

	function handle_edit_random_color() {
		const random = generate_random_color();
		edit_custom_color = random;
		edit_use_custom = true;
		edit_color = random;
	}

	async function handle_create_tag() {
		if (!new_tag_name.trim()) return;

		const color = use_custom_color ? custom_color : selected_color;

		if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
			alert('Please enter a valid hex color (e.g., #ff5733)');
			return;
		}

		creating_tag = true;
		try {
			await create_tag({ name: new_tag_name.trim(), color });
			new_tag_name = '';
			selected_color = DEFAULT_COLORS[0];
			custom_color = '';
			use_custom_color = false;
			show_create_form = false;
		} catch (err: any) {
			alert(err.message || 'Failed to create tag');
		} finally {
			creating_tag = false;
		}
	}

	function handle_edit_click(tag: any) {
		edit_tag_id = tag.id;
		edit_name = tag.name;
		edit_color = tag.color;
		// Check if it's a preset color
		if (DEFAULT_COLORS.includes(tag.color)) {
			edit_use_custom = false;
			edit_custom_color = '';
		} else {
			edit_use_custom = true;
			edit_custom_color = tag.color;
		}
	}

	async function handle_update_tag() {
		if (!edit_tag_id || !edit_name.trim()) return;

		const color = edit_use_custom ? edit_custom_color : edit_color;

		if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
			alert('Please enter a valid hex color (e.g., #ff5733)');
			return;
		}

		updating_tag = true;
		try {
			await update_tag({
				id: edit_tag_id,
				name: edit_name.trim(),
				color,
			});
			edit_tag_id = null;
		} catch (err: any) {
			alert(err.message || 'Failed to update tag');
		} finally {
			updating_tag = false;
		}
	}

	function cancel_edit() {
		edit_tag_id = null;
		edit_name = '';
		edit_color = '';
		edit_use_custom = false;
		edit_custom_color = '';
	}

	function handle_delete_click(tag_id: string) {
		delete_confirmation_id = tag_id;
	}

	async function confirm_delete() {
		if (!delete_confirmation_id) return;

		try {
			await delete_tag(delete_confirmation_id);
			delete_confirmation_id = null;
		} catch (err: any) {
			alert(err.message || 'Failed to delete tag');
		}
	}

	function cancel_delete() {
		delete_confirmation_id = null;
	}
</script>

<PageHeaderWithAction title="Tags">
	{#if !show_create_form}
		<button
			onclick={() => (show_create_form = true)}
			class="btn gap-2 btn-primary btn-sm"
		>
			<Tag size="20px" />
			New Tag
		</button>
	{/if}
</PageHeaderWithAction>
<PageNav />

{#if show_create_form}
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Create New Tag</h2>

			<div class="space-y-4">
				<!-- Tag Name -->
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Tag Name</legend>
					<label class="validator input w-full">
						<input
							type="text"
							placeholder="e.g., Client, Lead, Partner"
							bind:value={new_tag_name}
							class="grow"
							maxlength="30"
							required
						/>
					</label>
				</fieldset>

				<!-- Color Selection -->
				<div>
					<p class="mb-2 text-sm font-medium">Color</p>

					<!-- Preset Colors Grid -->
					<div class="mb-3 grid grid-cols-8 gap-2 md:grid-cols-16">
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
						<fieldset class="fieldset flex-1">
							<legend class="fieldset-legend">Custom Hex</legend>
							<label class="input flex items-center gap-2">
								<input
									type="text"
									placeholder="#ff5733"
									bind:value={custom_color}
									onfocus={() => (use_custom_color = true)}
									class="grow"
									maxlength="7"
								/>
								{#if use_custom_color && custom_color}
									<div
										class="size-6 rounded border border-base-300"
										style="background-color: {custom_color};"
									></div>
								{/if}
							</label>
						</fieldset>
						<button
							type="button"
							onclick={handle_random_color}
							class="tooltip btn gap-2 btn-outline"
							data-tip="Random color"
						>
							<Refresh size="20px" />
						</button>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-2">
					<button
						onclick={() => {
							show_create_form = false;
							new_tag_name = '';
							selected_color = DEFAULT_COLORS[0];
							custom_color = '';
							use_custom_color = false;
						}}
						class="btn btn-ghost"
					>
						Cancel
					</button>
					<button
						onclick={handle_create_tag}
						disabled={creating_tag || !new_tag_name.trim()}
						class="btn btn-primary"
					>
						{#if creating_tag}
							<span class="loading loading-spinner"></span>
						{:else}
							Create Tag
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#await get_tags() then tags}
	{#if tags.length === 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<EmptyState
					message="No tags yet. Create your first tag to organize your contacts!"
				/>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each tags as tag}
				{#if edit_tag_id === tag.id}
					<!-- Edit Mode Card -->
					<div class="card border border-base-300 bg-base-100 shadow">
						<div class="card-body p-4">
							<div class="space-y-3">
								<!-- Edit Name -->
								<fieldset class="fieldset">
									<legend class="fieldset-legend">Tag Name</legend>
									<label class="input w-full input-sm">
										<input
											type="text"
											bind:value={edit_name}
											class="grow"
											maxlength="30"
										/>
									</label>
								</fieldset>

								<!-- Edit Color -->
								<div>
									<p class="mb-2 text-xs font-medium">Color</p>
									<div class="mb-2 grid grid-cols-8 gap-1">
										{#each DEFAULT_COLORS as color}
											<button
												type="button"
												onclick={() => {
													edit_color = color;
													edit_use_custom = false;
												}}
												class="size-6 rounded border transition-transform hover:scale-110 {edit_color ===
													color && !edit_use_custom
													? 'border-primary ring-1 ring-primary'
													: 'border-base-300'}"
												style="background-color: {color};"
												aria-label="Select color {color}"
											></button>
										{/each}
									</div>

									<div class="flex gap-1">
										<label
											class="input flex flex-1 items-center gap-1 input-sm"
										>
											<input
												type="text"
												placeholder="#ff5733"
												bind:value={edit_custom_color}
												onfocus={() => {
													edit_use_custom = true;
													edit_color = edit_custom_color;
												}}
												class="grow"
												maxlength="7"
											/>
											{#if edit_use_custom && edit_custom_color}
												<div
													class="size-4 rounded border border-base-300"
													style="background-color: {edit_custom_color};"
												></div>
											{/if}
										</label>
										<button
											type="button"
											onclick={handle_edit_random_color}
											class="btn btn-square btn-outline btn-xs"
										>
											<Refresh size="14px" />
										</button>
									</div>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										onclick={cancel_edit}
										class="btn flex-1 btn-ghost btn-xs"
									>
										Cancel
									</button>
									<button
										onclick={handle_update_tag}
										disabled={updating_tag || !edit_name.trim()}
										class="btn flex-1 btn-primary btn-xs"
									>
										{#if updating_tag}
											<span class="loading loading-xs loading-spinner"
											></span>
										{:else}
											Save
										{/if}
									</button>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- View Mode Card -->
					<div
						class="card border border-base-300 bg-base-100 shadow transition-shadow hover:shadow-lg"
					>
						<div class="card-body p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div
										class="mb-2 badge badge-lg"
										style="background-color: {tag.color}; color: white; border: none;"
									>
										{tag.name}
									</div>
									<p class="text-sm opacity-70">
										{tag.contact_count}
										{tag.contact_count === 1 ? 'contact' : 'contacts'}
									</p>
								</div>

								<div class="flex gap-1">
									{#if delete_confirmation_id === tag.id}
										<ConfirmDialog
											is_inline={true}
											message="Delete tag?"
											on_confirm={confirm_delete}
											on_cancel={cancel_delete}
										/>
									{:else}
										<button
											onclick={() => handle_edit_click(tag)}
											class="tooltip btn btn-ghost btn-xs"
											data-tip="Edit"
										>
											<Edit size="16px" />
										</button>
										<button
											onclick={() => handle_delete_click(tag.id)}
											class="tooltip btn btn-ghost text-error btn-xs"
											data-tip="Delete"
										>
											<Trash size="16px" />
										</button>
									{/if}
								</div>
							</div>

							<!-- Show contacts with this tag -->
							{#if tag.contact_count > 0}
								{#await get_tag_contacts(tag.id) then contacts}
									<div class="divider my-2"></div>
									<div class="space-y-1">
										{#each contacts.slice(0, 3) as contact}
											<a
												href="/contacts/{contact.id}"
												class="block link text-sm link-hover"
											>
												{contact.name}
											</a>
										{/each}
										{#if contacts.length > 3}
											<p class="text-xs opacity-60">
												+{contacts.length - 3} more
											</p>
										{/if}
									</div>
								{/await}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
{/await}
