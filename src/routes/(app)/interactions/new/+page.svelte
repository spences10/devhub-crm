<script lang="ts">
	import { page } from '$app/state';
	import BaseCard from '#lib/components/base-card.svelte';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import {
		Button,
		Field,
		Select,
		Textarea,
	} from '#lib/components/ui/index.ts';
	import { ctrl_enter_submit } from '#lib/utils/keyboard-attachments.ts';
	import { get_contacts } from '../../contacts/contacts.remote';
	import { get_interaction_types } from '../../settings/interaction-types.remote';
	import { get_user_preferences } from '../../settings/settings.remote';
	import { create_interaction } from '../interactions.remote';

	const preselected_contact_id = $derived(
		page.url.searchParams.get('contact_id'),
	);

	const interaction_types = get_interaction_types();
</script>

<PageHeaderWithAction title="Log New Interaction" />
<PageNav />

{#await get_user_preferences() then preferences}
	<form {...create_interaction}>
		<BaseCard>
			{#snippet children()}
				<Field legend="Contact">
					{#await get_contacts() then contacts}
						<Select
							{...create_interaction.fields.contact_id.as('select')}
							required
							value={preselected_contact_id || ''}
						>
							<option value="" disabled>Select a contact</option>
							{#each contacts as contact}
								<option value={contact.id}>
									{contact.name}
									{#if contact.company}
										- {contact.company}
									{/if}
								</option>
							{/each}
						</Select>
					{/await}
				</Field>

				<Field legend="Interaction Type">
					{#await interaction_types}
						<Select disabled>
							<option>Loading...</option>
						</Select>
					{:then types}
						<Select
							{...create_interaction.fields.type.as('select')}
							required
							value={preferences.default_interaction_type || ''}
						>
							<option value="" disabled>Select type</option>
							{#each types as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</Select>
					{:catch}
						<Select disabled>
							<option>Failed to load types</option>
						</Select>
					{/await}
				</Field>

				<Field legend="Notes (Optional)">
					<Textarea
						{...create_interaction.fields.note.as('text')}
						rows={6}
						placeholder="Add any notes about this interaction..."
						attachment={ctrl_enter_submit()}
					/>
				</Field>

				<div class="card-actions justify-end">
					<a href="/interactions" class="btn btn-outline">Cancel</a>
					<Button type="submit" variant="primary">
						Log Interaction
					</Button>
				</div>
			{/snippet}
		</BaseCard>
	</form>
{/await}
