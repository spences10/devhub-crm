<script lang="ts">
	import { create_contact } from '../../routes/(app)/contacts/contacts.remote';
	import {
		Checkbox,
		Field,
		Input,
		Textarea,
	} from '#lib/components/ui/index.ts';

	type Props = {
		name?: string;
		email?: string;
		phone?: string;
		company?: string;
		title?: string;
		github_username?: string;
		is_vip?: boolean;
		birthday?: string;
		notes?: string;
	};

	let {
		name = '',
		email = '',
		phone = '',
		company = '',
		title = '',
		github_username = '',
		is_vip = false,
		birthday = '',
		notes = '',
	}: Props = $props();
</script>

<!-- Name & VIP - Two Column Grid -->
<div class="grid items-end gap-4 md:grid-cols-2">
	<Field legend="Name *">
		<Input
			{...create_contact.fields.name.as('text')}
			value={name}
			placeholder="John Doe"
			required
			validator
		/>
	</Field>

	<div class="pb-2">
		<Checkbox
			{...create_contact.fields.is_vip.as('checkbox')}
			checked={is_vip}
			label="Mark as VIP"
		/>
	</div>
</div>

<!-- Email & Phone - Two Column Grid -->
<div class="grid gap-4 md:grid-cols-2">
	<Field legend="Email">
		<Input
			{...create_contact.fields.email.as('email')}
			value={email}
			placeholder="Email"
			validator
		/>
	</Field>

	<Field legend="Phone">
		<Input
			{...create_contact.fields.phone.as('tel')}
			value={phone}
			placeholder="+1 (555) 123-4567"
		/>
	</Field>
</div>

<!-- Company & Title - Two Column Grid -->
<div class="grid gap-4 md:grid-cols-2">
	<Field legend="Company">
		<Input
			{...create_contact.fields.company.as('text')}
			value={company}
			placeholder="Acme Inc."
		/>
	</Field>

	<Field legend="Title">
		<Input
			{...create_contact.fields.title.as('text')}
			value={title}
			placeholder="Senior Developer"
		/>
	</Field>
</div>

<!-- GitHub Username & Birthday - Two Column Grid -->
<div class="grid gap-4 md:grid-cols-2">
	<Field
		legend="GitHub Username"
		helper_text="Enter username without @"
	>
		<Input
			{...create_contact.fields.github_username.as('text')}
			value={github_username}
			placeholder="octocat"
		/>
	</Field>

	<Field legend="Birthday">
		<Input
			{...create_contact.fields.birthday.as('date')}
			value={birthday}
		/>
	</Field>
</div>

<!-- Notes - Full Width -->
<Field legend="Notes">
	<Textarea
		{...create_contact.fields.notes.as('text')}
		value={notes}
		placeholder="Additional notes about this contact..."
	/>
</Field>
