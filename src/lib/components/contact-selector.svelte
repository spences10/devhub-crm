<script lang="ts">
	import type { Contact } from '#lib/types/db.ts';

	interface Props {
		contacts: Contact[];
		name?: string;
		required?: boolean;
		preselected_id?: string | null;
	}

	let {
		contacts,
		name = 'contact_id',
		required = false,
		preselected_id = null,
	}: Props = $props();
</script>

<fieldset class="fieldset">
	<legend class="fieldset-legend">Contact</legend>
	<label class="select w-full">
		<select {name} {required} value={preselected_id || ''}>
			<option value="" disabled>Select a contact</option>
			{#each contacts as contact}
				<option value={contact.id}>
					{contact.name}
					{#if contact.company}
						- {contact.company}
					{/if}
				</option>
			{/each}
		</select>
	</label>
</fieldset>
