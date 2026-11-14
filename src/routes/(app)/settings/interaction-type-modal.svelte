<script lang="ts">
	import {
		Button,
		Field,
		Input,
		Select,
	} from '#lib/components/ui/index.ts';
	import type { InteractionType } from '#lib/types/interaction-type.ts';
	import {
		AVAILABLE_THEME_COLORS,
		get_available_icons,
		get_color_name,
		get_icon_component,
	} from '#lib/utils/interaction-type-helpers.ts';

	interface Props {
		show: boolean;
		editingType: InteractionType | null;
		onSave: () => Promise<void>;
		onClose: () => void;
		form_value: string;
		form_label: string;
		form_icon: string;
		form_color: string;
		form_loading: boolean;
		form_error: string;
		onFormValueChange: (value: string) => void;
		onFormLabelChange: (label: string) => void;
		onFormIconChange: (icon: string) => void;
		onFormColorChange: (color: string) => void;
	}

	let {
		show,
		editingType,
		onSave,
		onClose,
		form_value,
		form_label,
		form_icon,
		form_color,
		form_loading,
		form_error,
		onFormValueChange,
		onFormLabelChange,
		onFormIconChange,
		onFormColorChange,
	}: Props = $props();
</script>

{#if show}
	<div class="modal modal-open">
		<div class="modal-box w-full max-w-md">
			<h3 class="text-lg font-bold">
				{editingType ? 'Edit' : 'Create'} Interaction Type
			</h3>

			{#if form_error}
				<div class="mt-4 alert alert-error">
					<span>{form_error}</span>
				</div>
			{/if}

			{#if !editingType}
				<div class="mt-4">
					<Field legend="Value (identifier)">
						<Input
							id="form-value"
							type="text"
							name="form_value"
							placeholder="my_type"
							value={form_value}
							onchange={(e) =>
								onFormValueChange(e.currentTarget.value)}
							disabled={form_loading}
						/>
						<span class="label-text-alt mt-1">
							Lowercase letters, numbers, underscores only
						</span>
					</Field>
				</div>
			{/if}

			<div class="mt-4">
				<Field legend="Label (display name)">
					<Input
						id="form-label"
						type="text"
						name="form_label"
						placeholder="My Type"
						value={form_label}
						onchange={(e) => onFormLabelChange(e.currentTarget.value)}
						disabled={form_loading}
					/>
				</Field>
			</div>

			<div class="mt-4">
				<Field legend="Icon">
					<Select
						id="form-icon"
						name="form_icon"
						value={form_icon}
						onchange={(e) => onFormIconChange(e.currentTarget.value)}
						disabled={form_loading}
					>
						{#each get_available_icons() as icon}
							<option value={icon}>{icon}</option>
						{/each}
					</Select>
					{#if form_icon}
						{@const IconComponent = get_icon_component(form_icon)}
						<div class="mt-2 flex items-center gap-2">
							<span class="text-sm">Preview:</span>
							<IconComponent class="h-6 w-6" />
						</div>
					{/if}
				</Field>
			</div>

			<div class="mt-4">
				<Field legend="Color">
					<Select
						id="form-color"
						name="form_color"
						value={form_color}
						onchange={(e) => onFormColorChange(e.currentTarget.value)}
						disabled={form_loading}
					>
						{#each AVAILABLE_THEME_COLORS as color}
							<option value={color.value}>{color.name}</option>
						{/each}
					</Select>
					<div class="mt-2">
						<span class="text-sm">Preview:</span>
						<div class="badge {form_color} mt-2 py-4">
							{get_color_name(form_color)}
						</div>
					</div>
				</Field>
			</div>

			<div class="modal-action mt-6">
				<Button
					variant="ghost"
					onclick={onClose}
					disabled={form_loading}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={onSave}
					disabled={form_loading || !form_label}
					loading={form_loading}
				>
					{editingType ? 'Update' : 'Create'}
				</Button>
			</div>
		</div>
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={onClose}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					onClose();
				}
			}}
		></div>
	</div>
{/if}
