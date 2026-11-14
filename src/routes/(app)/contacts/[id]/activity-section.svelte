<script lang="ts">
	import EmptyState from '#lib/components/empty-state.svelte';
	import { Calendar, Message, Sparkles } from '#lib/icons/index.ts';
	import {
		edit_state,
		handle_complete_follow_up,
		handle_delete_follow_up_click,
		handle_edit_follow_up_click,
		handle_edit_interaction_click,
		handle_delete_interaction_click,
	} from '#lib/state/contact-edit-state.svelte.ts';
	import FollowupItem from './followup-item.svelte';
	import InteractionItem from './interaction-item.svelte';
	import type {
		Interaction,
		FollowUp,
		UserPreferences,
	} from '#lib/types/db.ts';

	interface Props {
		interactions: Interaction[];
		pending_follow_ups: FollowUp[];
		overdue_follow_ups: FollowUp[];
		contact_id: string;
		contact_name: string;
		date_format: UserPreferences['date_format'];
	}

	let {
		interactions,
		pending_follow_ups,
		overdue_follow_ups,
		contact_id,
		contact_name,
		date_format,
	}: Props = $props();
</script>

{#if interactions.length === 0 && pending_follow_ups.length === 0}
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<EmptyState
				message="No activity yet. Start by logging an interaction or scheduling a follow-up!"
			/>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Activity Timeline Header -->
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-2xl font-bold">
				<Sparkles
					size="28px"
					class_names="text-primary"
					gradient={true}
				/>
				Activity Timeline
			</h2>
		</div>

		<div class="space-y-4">
			<!-- Follow-ups Section -->
			{#if pending_follow_ups.length > 0}
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-xl font-bold">
							<Calendar size="24px" />
							Pending Follow-ups
							{#if overdue_follow_ups.length > 0}
								<span class="badge badge-error">
									{overdue_follow_ups.length} overdue
								</span>
							{/if}
						</h3>
						<a
							href="/follow-ups/new?contact_id={contact_id}"
							class="btn btn-primary btn-sm"
						>
							Add Follow-up
						</a>
					</div>

					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each pending_follow_ups as follow_up}
							<FollowupItem
								{follow_up}
								{contact_id}
								{contact_name}
								{date_format}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Interactions Section -->
			{#if interactions.length > 0}
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-xl font-bold">
							<Message size="24px" />
							Recent Interactions
						</h3>
						<a
							href="/interactions/new?contact_id={contact_id}"
							class="btn btn-primary btn-sm"
						>
							Log Interaction
						</a>
					</div>

					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each interactions.slice(0, 10) as interaction}
							<InteractionItem
								{interaction}
								{contact_id}
								{contact_name}
								{date_format}
							/>
						{/each}
					</div>

					{#if interactions.length > 10}
						<div class="mt-4 text-center">
							<a
								href="/interactions?contact_id={contact_id}"
								class="link link-primary"
							>
								View all {interactions.length} interactions
							</a>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
