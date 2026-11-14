<script lang="ts">
	import { page } from '$app/state';
	import BaseCard from '#lib/components/base-card.svelte';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import {
		Button,
		Field,
		Input,
		Select,
		Textarea,
	} from '#lib/components/ui/index.ts';
	import { ctrl_enter_submit } from '#lib/utils/keyboard-attachments.ts';
	import { addDays, format, setHours, startOfDay } from 'date-fns';
	import { get_contacts } from '../../contacts/contacts.remote';
	import { get_user_preferences } from '../../settings/settings.remote';
	import { create_follow_up } from '../follow-ups.remote';

	const preselected_contact_id = $derived(
		page.url.searchParams.get('contact_id'),
	);

	function get_default_date(days_offset: number): {
		date_string: string;
		timestamp: number;
	} {
		const date = setHours(
			addDays(startOfDay(new Date()), days_offset),
			9,
		);
		return {
			date_string: format(date, "yyyy-MM-dd'T'HH:mm"),
			timestamp: date.getTime(),
		};
	}

	let date_input_value = $state('');
	let timestamp = $state(0);

	function handle_date_change(e: Event) {
		const target = e.target as HTMLInputElement;
		date_input_value = target.value;
		timestamp = new Date(target.value).getTime();
	}
</script>

<PageHeaderWithAction title="Create New Follow-up" />
<PageNav />

{#await get_user_preferences() then preferences}
	{@const default_values = get_default_date(
		preferences.default_follow_up_days,
	)}
	{#if !date_input_value}
		{((date_input_value = default_values.date_string),
		(timestamp = default_values.timestamp),
		'')}
	{/if}

	<form {...create_follow_up}>
		<BaseCard>
			{#snippet children()}
				<Field legend="Contact">
					{#await get_contacts() then contacts}
						<Select
							{...create_follow_up.fields.contact_id.as('select')}
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

				<Field
					legend="Due Date"
					helper_text="When do you want to follow up with this contact?"
				>
					<Input
						type="datetime-local"
						required
						value={date_input_value}
						oninput={handle_date_change}
					/>
					<input
						{...create_follow_up.fields.due_date.as(
							'hidden',
							String(timestamp),
						)}
					/>
				</Field>

				<Field legend="Notes (Optional)">
					<Textarea
						{...create_follow_up.fields.note.as('text')}
						rows={6}
						placeholder="What do you need to follow up about?"
						attachment={ctrl_enter_submit()}
					/>
				</Field>

				<div class="card-actions justify-end">
					<a href="/follow-ups" class="btn btn-outline">Cancel</a>
					<Button type="submit" variant="primary">
						Create Follow-up
					</Button>
				</div>
			{/snippet}
		</BaseCard>
	</form>
{/await}
