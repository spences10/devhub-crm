<script lang="ts">
	import { goto } from '$app/navigation';
	import EmptyState from '#lib/components/empty-state.svelte';
	import ItemCount from '#lib/components/item-count.svelte';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import SortableTableHeader from '#lib/components/sortable-table-header.svelte';
	import { GitHub, StarFill } from '#lib/icons/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import type { Contact } from '#lib/types/db.ts';
	import { Head } from 'svead';
	import { get_user_preferences } from '../settings/settings.remote';
	import { get_contacts } from './contacts.remote';

	let search = $state('');
	let current_sort = $state<
		| 'name'
		| 'email'
		| 'company'
		| 'github'
		| 'status'
		| 'last_contacted'
		| 'recently_added'
	>('name');
	let sort_direction = $state<'asc' | 'desc'>('asc');

	const contacts_query = get_contacts();
	const preferences_query = get_user_preferences();

	// Client-side filtering function
	function filter_contacts(
		contacts: Contact[],
		query: string,
	): Contact[] {
		if (!contacts) return [];
		if (query === '') return contacts;

		const search_query = query.toLowerCase();

		return contacts.filter((contact) => {
			return (
				contact.name.toLowerCase().includes(search_query) ||
				contact.email?.toLowerCase().includes(search_query) ||
				contact.company?.toLowerCase().includes(search_query) ||
				contact.github_username
					?.toLowerCase()
					.includes(search_query) ||
				contact.notes?.toLowerCase().includes(search_query) ||
				contact.title?.toLowerCase().includes(search_query) ||
				contact.phone?.toLowerCase().includes(search_query) ||
				// Search through tags
				(Array.isArray(contact.tags) &&
					contact.tags.some((tag) =>
						tag.name.toLowerCase().includes(search_query),
					))
			);
		});
	}

	function sort_contacts(contacts: Contact[]): Contact[] {
		const sorted = [...contacts];
		switch (current_sort) {
			case 'name':
				sorted.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'email':
				sorted.sort((a, b) => {
					const a_email = a.email || '';
					const b_email = b.email || '';
					return a_email.localeCompare(b_email);
				});
				break;
			case 'company':
				sorted.sort((a, b) => {
					const a_company = a.company || '';
					const b_company = b.company || '';
					return a_company.localeCompare(b_company);
				});
				break;
			case 'github':
				sorted.sort((a, b) => {
					const a_github = a.github_username || '';
					const b_github = b.github_username || '';
					return a_github.localeCompare(b_github);
				});
				break;
			case 'status':
				sorted.sort((a, b) => b.is_vip - a.is_vip); // VIPs first
				break;
			case 'last_contacted':
				sorted.sort((a, b) => {
					const a_time = a.last_contacted_at || 0;
					const b_time = b.last_contacted_at || 0;
					return b_time - a_time; // Most recent first
				});
				break;
			case 'recently_added':
				sorted.sort((a, b) => b.created_at - a.created_at);
				break;
		}

		// Apply direction
		if (sort_direction === 'desc') {
			sorted.reverse();
		}

		return sorted;
	}

	function toggle_sort(
		column:
			| 'name'
			| 'email'
			| 'company'
			| 'github'
			| 'status'
			| 'last_contacted'
			| 'recently_added',
	) {
		if (current_sort === column) {
			// Toggle direction
			sort_direction = sort_direction === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, default to asc
			current_sort = column;
			sort_direction = 'asc';
		}
	}

	// Helper to get initials from name
	function get_initials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<Head seo_config={seo_configs.contacts} />

<PageHeaderWithAction title="Contacts">
	<div class="flex gap-2">
		<a
			href="/contacts/import/github"
			class="tooltip btn btn-ghost"
			data-tip="Import from GitHub"
			aria-label="Import contacts from GitHub"
		>
			<GitHub class_names="inline h-5 w-5 mr-2" gradient={true} />
		</a>
		<a href="/contacts/new" class="btn btn-primary">New Contact</a>
	</div>
</PageHeaderWithAction>
<PageNav />
<!-- Search Bar -->
<div class="mb-6">
	<fieldset class="fieldset">
		<legend class="fieldset-legend">Search</legend>
		<label class="input w-full">
			<input
				type="text"
				bind:value={search}
				placeholder="Search by name, email, company, or GitHub username"
				class="grow"
			/>
		</label>
	</fieldset>
</div>

<!-- Contacts List -->
{#if contacts_query.error || preferences_query.error}
	<div class="alert alert-error">
		<p>Error loading contacts. Please try again.</p>
	</div>
{:else if (contacts_query.loading || preferences_query.loading) && (contacts_query.current === undefined || preferences_query.current === undefined)}
	<!-- Only show loading spinner on initial load -->
	<div class="flex justify-center p-8">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else}
	{@const contacts = contacts_query.current ?? []}
	{@const preferences = preferences_query.current}
	{@const filtered_contacts = filter_contacts(contacts, search)}
	{@const sorted_contacts = sort_contacts(filtered_contacts)}
	{#if filtered_contacts.length === 0}
		<EmptyState
			message={search
				? 'No contacts found matching your search.'
				: 'No contacts yet.'}
			action_href={!search ? '/contacts/new' : undefined}
			action_text={!search ? 'Add Your First Contact' : undefined}
		/>
	{:else}
		<div
			class="overflow-x-auto"
			class:opacity-60={contacts_query.loading}
		>
			<table class="table">
				<thead>
					<tr>
						<SortableTableHeader
							label="Contact"
							column="name"
							{current_sort}
							{sort_direction}
							on_toggle={toggle_sort}
						/>
						<SortableTableHeader
							label="Email"
							column="email"
							{current_sort}
							{sort_direction}
							on_toggle={toggle_sort}
							class_names="hidden md:table-cell"
						/>
						<SortableTableHeader
							label="Company"
							column="company"
							{current_sort}
							{sort_direction}
							on_toggle={toggle_sort}
							class_names="hidden lg:table-cell"
						/>
						<SortableTableHeader
							label="Status"
							column="status"
							{current_sort}
							{sort_direction}
							on_toggle={toggle_sort}
							center={true}
							class_names="hidden md:table-cell"
						/>
					</tr>
				</thead>
				<tbody>
					{#each sorted_contacts as contact}
						<tr
							class="cursor-pointer hover:bg-base-100"
							onclick={() => goto(`/contacts/${contact.id}`)}
						>
							<td>
								<div class="flex items-center gap-3">
									{#if contact.avatar_url}
										<img
											src={contact.avatar_url}
											alt="{contact.name} avatar"
											class="size-10 rounded-full object-cover"
										/>
									{:else}
										<div
											class="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-content"
										>
											{get_initials(contact.name)}
										</div>
									{/if}
									<div class="flex flex-col">
										<span class="font-medium">
											{contact.name}
										</span>
										{#if contact.github_username}
											<a
												href="https://github.com/{contact.github_username}"
												target="_blank"
												rel="noopener noreferrer"
												class="link text-xs link-primary"
												onclick={(e) => e.stopPropagation()}
											>
												@{contact.github_username}
											</a>
										{/if}
										<div
											class="mt-1 text-xs text-base-content/70 md:hidden"
										>
											{contact.email || 'No email'}
										</div>
									</div>
								</div>
							</td>
							<td class="hidden md:table-cell">
								{contact.email || '-'}
							</td>
							<td class="hidden lg:table-cell">
								{contact.company || '-'}
							</td>
							<td class="hidden text-center md:table-cell">
								{#if contact.is_vip}
									<div class="inline-block" title="VIP">
										<StarFill
											size="48px"
											class_names="h-4 w-4 text-warning"
										/>
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<ItemCount count={filtered_contacts.length} item_name="contact" />
	{/if}
{/if}
