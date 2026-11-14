<script lang="ts">
	import { page } from '$app/state';
	import BaseCard from '#lib/components/base-card.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import SocialLinksManager from '#lib/components/social-links-manager.svelte';
	import TagManager from '#lib/components/tag-manager.svelte';
	import {
		Checkbox,
		Field,
		Input,
		Textarea,
	} from '#lib/components/ui/index.ts';
	import { Cancel, Crown } from '#lib/icons/index.ts';
	import { ctrl_enter_callback } from '#lib/utils/keyboard-attachments.ts';
	import { format } from 'date-fns';
	import { scale } from 'svelte/transition';
	import {
		add_tag_to_contact,
		create_tag,
		get_contact_tags,
		get_tags,
		remove_tag_from_contact,
	} from '../../../tags/tags.remote';
	import {
		add_social_link,
		delete_social_link,
		get_contact,
		get_social_links,
		update_contact,
	} from '../../contacts.remote';

	const contact_id = $derived(page.params.id);
	const contact_query = $derived(
		contact_id ? get_contact(contact_id) : null,
	);
	const contact_tags_query = $derived(
		contact_id ? get_contact_tags(contact_id) : null,
	);
	const social_links_query = $derived(
		contact_id ? get_social_links(contact_id) : null,
	);
	const all_tags_query = get_tags();

	let error = $state<string | null>(null);
	let saving = $state(false);

	// Track current field values to avoid stale data
	let contact_state = $state<Record<string, any>>({});

	async function save_with_indicator(fn: () => Promise<void>) {
		saving = true;
		try {
			await fn();
			error = null;
		} catch (err: any) {
			error = err.message || 'Failed to save';
		} finally {
			setTimeout(() => (saving = false), 500);
		}
	}

	async function save_field(
		field: string,
		value: string | boolean,
		current_contact: any,
	) {
		if (!contact_id) return;

		// Update the local state with the new value
		contact_state[field] = value === '' ? undefined : value;

		// Build the update object using the tracked state, falling back to current_contact
		const update_data = {
			id: contact_id,
			name: contact_state.name ?? current_contact.name,
			email:
				contact_state.email ?? current_contact.email ?? undefined,
			phone:
				contact_state.phone ?? current_contact.phone ?? undefined,
			company:
				contact_state.company ?? current_contact.company ?? undefined,
			title:
				contact_state.title ?? current_contact.title ?? undefined,
			github_username:
				contact_state.github_username ??
				current_contact.github_username ??
				undefined,
			avatar_url:
				contact_state.avatar_url ??
				current_contact.avatar_url ??
				undefined,
			is_vip: contact_state.is_vip ?? current_contact.is_vip === 1,
			birthday:
				contact_state.birthday ??
				current_contact.birthday ??
				undefined,
			in_network_since:
				contact_state.in_network_since ??
				(current_contact.in_network_since
					? format(current_contact.in_network_since, 'yyyy-MM-dd')
					: undefined),
			notes:
				contact_state.notes ?? current_contact.notes ?? undefined,
		};

		// Use .updates() to refresh the get_contact query globally after mutation
		// This ensures the contact detail page shows fresh data when navigating back
		await save_with_indicator(() =>
			update_contact(update_data).updates(get_contact(contact_id)),
		);
	}
</script>

<div class="mb-8 flex items-center justify-between">
	<h1 class="text-3xl font-bold">Edit Contact</h1>
	<div class="flex items-center gap-2">
		{#if saving}
			<span class="badge badge-lg badge-success">Saving...</span>
		{/if}
		<a
			href="/contacts/{contact_id}"
			class="tooltip btn gap-2 btn-ghost text-error btn-sm"
			data-tip="Cancel"
			aria-label="Cancel editing"
		>
			<Cancel size="20px" />
		</a>
	</div>
</div>
<PageNav />

{#if !contact_query}
	<div class="alert alert-error">
		<p>Invalid contact ID</p>
	</div>
{:else if contact_query.error}
	<div class="alert alert-error">
		<p>Error loading contact. Please try again.</p>
	</div>
{:else if contact_query.loading && contact_query.current === undefined}
	<!-- Only show loading spinner on initial load -->
	<div class="flex justify-center p-8">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else if contact_query.current}
	{@const contact = contact_query.current}
	{@const is_vip = contact_state.is_vip ?? contact.is_vip === 1}
	{#key contact_id}
		<BaseCard>
			{#snippet children()}
				<div class="space-y-4">
					<!-- Row 1: Name, Email, Phone - Three Column Grid -->
					<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<Field legend="Name *">
							<Input
								type="text"
								value={contact.name}
								placeholder="John Doe"
								required
								validator
								onblur={(e) =>
									save_field('name', e.currentTarget.value, contact)}
							/>
						</Field>

						<Field legend="Email">
							<Input
								type="email"
								value={contact.email || ''}
								placeholder="Email"
								validator
								onblur={(e) =>
									save_field('email', e.currentTarget.value, contact)}
							/>
						</Field>

						<Field legend="Phone">
							<Input
								type="tel"
								value={contact.phone || ''}
								placeholder="+1 (555) 123-4567"
								onblur={(e) =>
									save_field('phone', e.currentTarget.value, contact)}
							/>
						</Field>
					</div>

					<!-- Row 2: Company, Title, Birthday - Three Column Grid -->
					<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<Field legend="Company">
							<Input
								type="text"
								value={contact.company || ''}
								placeholder="Acme Inc."
								onblur={(e) =>
									save_field(
										'company',
										e.currentTarget.value,
										contact,
									)}
							/>
						</Field>

						<Field legend="Title">
							<Input
								type="text"
								value={contact.title || ''}
								placeholder="Senior Developer"
								onblur={(e) =>
									save_field('title', e.currentTarget.value, contact)}
							/>
						</Field>

						<Field legend="Birthday">
							<Input
								type="date"
								value={contact.birthday || ''}
								onblur={(e) =>
									save_field(
										'birthday',
										e.currentTarget.value,
										contact,
									)}
							/>
						</Field>
					</div>

					<!-- Row 3: GitHub Username, In Network Since, VIP - Three Column Grid -->
					<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<Field
							legend="GitHub Username"
							helper_text="Enter username without @"
						>
							<Input
								type="text"
								value={contact.github_username || ''}
								placeholder="octocat"
								onblur={(e) =>
									save_field(
										'github_username',
										e.currentTarget.value,
										contact,
									)}
							/>
						</Field>

						<Field
							legend="In Network Since"
							helper_text="When you first met or added this contact to your network"
						>
							<Input
								type="date"
								value={contact.in_network_since
									? new Date(contact.in_network_since)
											.toISOString()
											.split('T')[0]
									: new Date(contact.created_at)
											.toISOString()
											.split('T')[0]}
								onblur={(e) =>
									save_field(
										'in_network_since',
										e.currentTarget.value,
										contact,
									)}
							/>
						</Field>

						<Field>
							{#snippet legend()}
								<span class="inline-flex items-center gap-2">
									VIP Status
									{#if is_vip}
										<span
											in:scale={{ duration: 300, start: 0.5 }}
											class="text-warning"
										>
											<Crown size="18px" />
										</span>
									{/if}
								</span>
							{/snippet}
							<Checkbox
								checked={is_vip}
								label="Mark as VIP"
								onchange={(e) =>
									save_field(
										'is_vip',
										e.currentTarget.checked,
										contact,
									)}
							/>
						</Field>
					</div>

					<!-- Notes - Full Width -->
					<Field legend="Notes">
						<Textarea
							value={contact.notes || ''}
							placeholder="Additional notes about this contact..."
							onblur={(e) =>
								save_field('notes', e.currentTarget.value, contact)}
							attachment={ctrl_enter_callback((value) =>
								save_field('notes', value || '', contact),
							)}
						/>
					</Field>

					<!-- Social Links Management - Separate Query for Instant Updates -->
					{#if social_links_query}
						{#await social_links_query then links}
							<SocialLinksManager
								social_links={links || []}
								on_add={async (platform: string, url: string) => {
									await add_social_link({
										contact_id: contact.id,
										platform,
										url,
									}).updates(social_links_query);
								}}
								on_delete={async (link_id: string) => {
									await delete_social_link(link_id).updates(
										social_links_query,
									);
								}}
							/>
						{/await}
					{/if}

					<!-- Tags Management -->
					{#if contact_tags_query?.loading || all_tags_query.loading}
						<div class="flex justify-center p-4">
							<span class="loading loading-md loading-spinner"></span>
						</div>
					{:else if contact_tags_query?.error || all_tags_query.error}
						<div class="alert alert-warning">
							<p>Error loading tags</p>
						</div>
					{:else if contact_tags_query?.current && all_tags_query.current}
						{@const contact_tags = contact_tags_query.current}
						{@const all_tags = all_tags_query.current}
						<TagManager
							{contact_tags}
							available_tags={all_tags}
							on_add_tag={(tag_id: string) =>
								add_tag_to_contact({
									contact_id: contact.id,
									tag_id,
								})}
							on_remove_tag={(tag_id: string) =>
								remove_tag_from_contact({
									contact_id: contact.id,
									tag_id,
								})}
							on_create_tag={(name: string, color: string) =>
								create_tag({ name, color })}
						/>
					{/if}

					<!-- Error Display -->
					{#if error}
						<div class="alert alert-error">
							<span>{error}</span>
						</div>
					{/if}
				</div>
			{/snippet}
		</BaseCard>
	{/key}
{/if}
