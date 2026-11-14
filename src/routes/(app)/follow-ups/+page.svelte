<script lang="ts">
	import ActivityCard from '#lib/components/activity-card.svelte';
	import BaseCard from '#lib/components/base-card.svelte';
	import EmptyState from '#lib/components/empty-state.svelte';
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import ItemCount from '#lib/components/item-count.svelte';
	import PageHeaderWithAction from '#lib/components/page-header-with-action.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import SearchBar from '#lib/components/search-bar.svelte';
	import {
		Calendar,
		Check,
		CircleBack,
		Edit,
		Trash,
	} from '#lib/icons/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import type { FollowUp } from '#lib/types/db.ts';
	import {
		format_date,
		format_due_date,
		is_overdue,
	} from '#lib/utils/date-helpers.ts';
	import { format } from 'date-fns';
	import { Head } from 'svead';
	import { get_user_preferences } from '../settings/settings.remote';
	import {
		complete_follow_up,
		delete_follow_up,
		get_all_follow_ups,
		get_contact_follow_ups,
		reopen_follow_up,
		update_follow_up,
	} from './follow-ups.remote';

	let search = $state('');
	let filter = $state<'all' | 'pending' | 'completed' | 'overdue'>(
		'all',
	);

	let delete_confirmation_id = $state<string | null>(null);
	let delete_contact_id = $state<string | null>(null);
	let edit_follow_up_id = $state<string | null>(null);
	let edit_contact_id = $state<string | null>(null);
	let edit_due_date_str = $state(''); // datetime-local string format
	let edit_note = $state('');

	// Store queries - use $derived for search reactivity
	const all_follow_ups = $derived(get_all_follow_ups(search));
	const preferences = get_user_preferences();

	const filter_options = [
		'all',
		'pending',
		'completed',
		'overdue',
	] as const;

	function filter_follow_ups(
		follow_ups: Array<FollowUp & { contact_name: string }>,
		filter_type: typeof filter,
	) {
		const now = Date.now();
		if (filter_type === 'pending') {
			return follow_ups.filter((f) => !f.completed);
		} else if (filter_type === 'completed') {
			return follow_ups.filter((f) => f.completed);
		} else if (filter_type === 'overdue') {
			return follow_ups.filter(
				(f) => !f.completed && f.due_date < now,
			);
		}
		return follow_ups;
	}

	function handle_edit_click(
		event: MouseEvent,
		follow_up: FollowUp & { contact_name: string },
	) {
		event.stopPropagation();
		edit_follow_up_id = follow_up.id;
		edit_contact_id = follow_up.contact_id;
		// Convert timestamp to datetime-local string format
		const date = new Date(follow_up.due_date);
		edit_due_date_str = format(date, "yyyy-MM-dd'T'HH:mm");
		edit_note = follow_up.note || '';
	}

	async function save_edit() {
		if (!edit_follow_up_id || !edit_contact_id) return;

		// Convert datetime-local string to timestamp
		const due_date = new Date(edit_due_date_str).getTime();

		// Use .updates() to refresh both the list query and contact-specific query
		await update_follow_up({
			id: edit_follow_up_id,
			due_date,
			note: edit_note,
		}).updates(
			get_all_follow_ups(search),
			get_contact_follow_ups(edit_contact_id),
		);

		edit_follow_up_id = null;
		edit_contact_id = null;
	}

	function cancel_edit() {
		edit_follow_up_id = null;
	}

	async function handle_complete(
		follow_up: FollowUp & { contact_name: string },
	) {
		// Use .updates() to refresh both queries
		await complete_follow_up(follow_up.id).updates(
			get_all_follow_ups(search),
			get_contact_follow_ups(follow_up.contact_id),
		);
	}

	async function handle_reopen(
		follow_up: FollowUp & { contact_name: string },
	) {
		// Use .updates() to refresh both queries
		await reopen_follow_up(follow_up.id).updates(
			get_all_follow_ups(search),
			get_contact_follow_ups(follow_up.contact_id),
		);
	}

	function handle_delete_click(
		event: MouseEvent,
		follow_up: FollowUp & { contact_name: string },
	) {
		event.stopPropagation();
		delete_confirmation_id = follow_up.id;
		delete_contact_id = follow_up.contact_id;
	}

	async function confirm_delete() {
		if (!delete_confirmation_id || !delete_contact_id) return;

		// Use .updates() to refresh both queries
		await delete_follow_up(delete_confirmation_id).updates(
			get_all_follow_ups(search),
			get_contact_follow_ups(delete_contact_id),
		);

		delete_confirmation_id = null;
		delete_contact_id = null;
	}

	function cancel_delete() {
		delete_confirmation_id = null;
	}
</script>

<Head seo_config={seo_configs.followUps} />

<PageHeaderWithAction title="Follow-ups">
	<a href="/follow-ups/new" class="btn btn-primary">
		New Follow-up
	</a>
</PageHeaderWithAction>
<PageNav />

<!-- Search Bar -->
<SearchBar
	bind:value={search}
	placeholder="Search by contact name or note"
	on_change={() => {}}
/>

<!-- Filter Tabs -->
<FilterTabs
	options={filter_options}
	active_filter={filter}
	on_filter_change={(f: typeof filter) => (filter = f)}
/>

<!-- Follow-ups List -->
{#if all_follow_ups.error || preferences.error}
	<div class="alert alert-error">
		<p>Error loading follow-ups. Please try again.</p>
	</div>
{:else if (all_follow_ups.loading || preferences.loading) && (all_follow_ups.current === undefined || preferences.current === undefined)}
	<!-- Only show loading spinner on initial load -->
	<div class="flex justify-center p-8">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else}
	{@const all_follow_ups_data = all_follow_ups.current ?? []}
	{@const preferences_data = preferences.current}
	{@const follow_ups = filter_follow_ups(all_follow_ups_data, filter)}
	{#if follow_ups.length === 0}
		<EmptyState
			message={search
				? 'No follow-ups found matching your search.'
				: filter === 'all'
					? 'No follow-ups yet.'
					: `No ${filter} follow-ups found.`}
			action_href={!search && filter === 'all'
				? '/follow-ups/new'
				: undefined}
			action_text={!search && filter === 'all'
				? 'Create Your First Follow-up'
				: undefined}
		/>
	{:else}
		<div
			class="grid grid-cols-1 gap-4 md:grid-cols-2"
			class:opacity-60={all_follow_ups.loading}
		>
			{#each follow_ups as follow_up}
				{@const overdue =
					!follow_up.completed && is_overdue(follow_up.due_date)}
				{@const icon_color =
					overdue && !follow_up.completed
						? 'bg-error text-error-content'
						: follow_up.completed
							? 'bg-success text-success-content'
							: 'bg-base-200'}
				{@const metadata_classes =
					overdue && !follow_up.completed
						? 'opacity-60 text-error'
						: 'opacity-60'}
				{#if edit_follow_up_id === follow_up.id}
					<!-- Edit Mode -->
					<BaseCard
						class="shadow-md transition-shadow hover:shadow-lg"
						body_class="p-4"
					>
						{#snippet children()}
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<a
										href="/contacts/{follow_up.contact_id}"
										class="link text-lg font-semibold link-hover"
									>
										{follow_up.contact_name}
									</a>
								</div>

								<div class="space-y-3">
									<fieldset class="fieldset">
										<legend class="fieldset-legend">Due Date</legend>
										<label class="input w-full">
											<input
												type="datetime-local"
												bind:value={edit_due_date_str}
												class="grow"
											/>
										</label>
									</fieldset>

									<fieldset class="fieldset">
										<legend class="fieldset-legend">Note</legend>
										<textarea
											bind:value={edit_note}
											class="textarea h-24 w-full"
											placeholder="Add a note..."></textarea>
									</fieldset>
								</div>

								<div class="flex justify-end gap-2">
									<button
										class="btn btn-ghost btn-sm"
										onclick={cancel_edit}
									>
										Cancel
									</button>
									<button
										class="btn btn-primary btn-sm"
										onclick={save_edit}
									>
										Save
									</button>
								</div>
							</div>
						{/snippet}
					</BaseCard>
				{:else}
					<!-- View Mode -->
					<ActivityCard
						icon={Calendar}
						icon_color_classes={icon_color}
						contact_id={follow_up.contact_id}
						contact_name={follow_up.contact_name}
						metadata="Due: {format_due_date(
							follow_up.due_date,
							preferences_data?.date_format ?? 'YYYY-MM-DD',
						)}"
						{metadata_classes}
						note={follow_up.note}
						footer_text={follow_up.completed && follow_up.completed_at
							? `Completed: ${format_date(
									new Date(follow_up.completed_at),
									preferences_data?.date_format ?? 'YYYY-MM-DD',
								)}`
							: undefined}
						show_delete_confirmation={delete_confirmation_id ===
							follow_up.id}
						on_confirm_delete={confirm_delete}
						on_cancel_delete={cancel_delete}
					>
						{#snippet action_buttons()}
							{#if follow_up.completed}
								<button
									onclick={() => handle_reopen(follow_up)}
									class="btn gap-1 btn-ghost btn-xs"
									aria-label="Reopen follow-up"
								>
									<CircleBack size="16px" />
									Reopen
								</button>
							{:else}
								<button
									onclick={() => handle_complete(follow_up)}
									class="btn gap-1 btn-ghost text-success btn-xs"
									aria-label="Complete follow-up"
								>
									<Check size="16px" />
									Complete
								</button>
							{/if}
							<button
								class="btn gap-1 btn-ghost btn-xs"
								aria-label="Edit follow-up"
								onclick={(e) => handle_edit_click(e, follow_up)}
							>
								<Edit size="16px" />
								Edit
							</button>
							<button
								class="btn gap-1 btn-ghost text-error btn-xs"
								aria-label="Delete follow-up"
								onclick={(e) => handle_delete_click(e, follow_up)}
							>
								<Trash size="16px" />
								Delete
							</button>
						{/snippet}
					</ActivityCard>
				{/if}
			{/each}
		</div>

		<ItemCount count={follow_ups.length} item_name="follow-up" />
	{/if}
{/if}
