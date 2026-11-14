<script lang="ts">
	import BaseCard from '#lib/components/base-card.svelte';
	import EmptyState from '#lib/components/empty-state.svelte';
	import FollowUpCard from '#lib/components/follow-up-card.svelte';
	import InteractionCard from '#lib/components/interaction-card.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import { Cross, Sparkles, Warning } from '#lib/icons/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import { Head } from 'svead';
	import { get_user_preferences } from '../settings/settings.remote';
	import {
		get_dashboard_activity,
		get_dashboard_insights,
		get_dashboard_stats,
		get_follow_up_context,
	} from './dashboard.remote';

	const stats_query = get_dashboard_stats();
	const activity_query = get_dashboard_activity();
	const preferences_query = get_user_preferences();
	const insights_query = get_dashboard_insights();
</script>

<Head seo_config={seo_configs.dashboard} />

<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
	<h1 class="text-3xl font-bold">Dashboard</h1>

	<div class="flex gap-2">
		<a href="/contacts/new" class="btn btn-primary btn-sm">
			<Cross size="10px" type="add" class_names="-mr-1" />
			Contact
		</a>
		<a href="/interactions/new" class="btn btn-secondary btn-sm">
			<Cross size="10px" type="add" class_names="-mr-1" />
			Interaction
		</a>
		<a href="/follow-ups/new" class="btn btn-accent btn-sm">
			<Cross size="10px" type="add" class_names="-mr-1" />
			Follow-up
		</a>
	</div>
</div>
<PageNav />
<!-- Stats Bar -->
{#if stats_query.loading}
	<div class="mb-8 flex justify-center">
		<span class="loading loading-sm loading-spinner"></span>
	</div>
{:else if stats_query.error}
	<div class="mb-8 alert alert-error">
		<p>Error loading stats</p>
	</div>
{:else if stats_query.current}
	{@const stats = stats_query.current}
	<div class="mb-8 flex flex-wrap items-center gap-2 text-sm">
		<a href="/contacts" class="link link-hover">
			<span class="font-semibold">{stats.contacts}</span>
			contact{stats.contacts !== 1 ? 's' : ''}
		</a>
		<span class="opacity-50">•</span>
		<a href="/interactions" class="link link-hover">
			<span class="font-semibold">{stats.interactions}</span>
			interaction{stats.interactions !== 1 ? 's' : ''}
		</a>
		<span class="opacity-50">•</span>
		<a href="/follow-ups" class="link link-hover">
			<span class="font-semibold">{stats.follow_ups.pending}</span>
			pending follow-up{stats.follow_ups.pending !== 1 ? 's' : ''}
		</a>
		{#if stats.follow_ups.overdue > 0}
			<span class="badge badge-sm badge-error">
				{stats.follow_ups.overdue} overdue
			</span>
		{/if}
	</div>
{/if}

<!-- AI Insights Section -->
{#if insights_query.current}
	{@const insights = insights_query.current}
	{@const has_insights =
		insights.interaction_insights.total_interactions > 0 ||
		insights.reconnect_suggestions.length > 0}
	{#if has_insights}
		<div class="mb-8 grid gap-6 lg:grid-cols-2">
			<!-- Network Activity Widget -->
			{#if insights.interaction_insights.total_interactions > 0}
				<BaseCard>
					{#snippet children()}
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title">Network Activity</h2>
							<span class="text-xs opacity-60"> Last 30 days </span>
						</div>

						<!-- Activity Summary -->
						<div class="mb-4 grid grid-cols-2 gap-4">
							<div
								class="rounded-lg border border-base-300 bg-base-200/50 p-3"
							>
								<div class="text-xs opacity-60">This Month</div>
								<div class="text-2xl font-bold text-primary">
									{insights.interaction_insights
										.interactions_this_month}
								</div>
								<div class="text-xs">
									{#if insights.interaction_insights.interactions_last_month > 0}
										{@const change =
											insights.interaction_insights
												.interactions_this_month -
											insights.interaction_insights
												.interactions_last_month}
										{@const percent = Math.round(
											(change /
												insights.interaction_insights
													.interactions_last_month) *
												100,
										)}
										<span
											class:text-success={change > 0}
											class:text-error={change < 0}
										>
											{change > 0 ? '+' : ''}{percent}% vs last month
										</span>
									{:else}
										interactions
									{/if}
								</div>
							</div>
							<div
								class="rounded-lg border border-base-300 bg-base-200/50 p-3"
							>
								<div class="text-xs opacity-60">Contacts Engaged</div>
								<div class="text-2xl font-bold text-secondary">
									{insights.interaction_insights
										.unique_contacts_this_month}
								</div>
								<div class="text-xs opacity-60">this month</div>
							</div>
						</div>

						<!-- Interaction Type Breakdown -->
						{#if insights.interaction_insights.type_breakdown.length > 0}
							<div class="mb-3">
								<div class="mb-2 text-sm font-semibold">
									Interaction Types
								</div>
								<div class="space-y-2">
									{#each insights.interaction_insights.type_breakdown as type}
										<div class="flex items-center gap-2">
											<div class="flex-1">
												<div
													class="flex items-center justify-between text-sm"
												>
													<span>{type.label}</span>
													<span class="opacity-60">{type.count}</span>
												</div>
												<div
													class="mt-1 h-2 w-full overflow-hidden rounded-full bg-base-300"
												>
													<div
														class="h-full bg-primary"
														style="width: {type.percentage}%"
													></div>
												</div>
											</div>
											<span
												class="w-10 text-right text-xs font-semibold opacity-60"
											>
												{type.percentage}%
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Most Active Contacts -->
						{#if insights.interaction_insights.most_active_contacts.length > 0}
							<div>
								<div class="mb-2 text-sm font-semibold">
									Most Active
								</div>
								<div class="space-y-1">
									{#each insights.interaction_insights.most_active_contacts.slice(0, 3) as contact}
										<a
											href={`/contacts/${contact.contact_id}`}
											class="flex items-center justify-between rounded-lg border border-base-300 px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-base-200"
										>
											<span class="font-medium"
												>{contact.contact_name}</span
											>
											<span class="badge badge-ghost badge-sm">
												{contact.interaction_count} interaction{contact.interaction_count !==
												1
													? 's'
													: ''}
											</span>
										</a>
									{/each}
								</div>
							</div>
						{/if}
					{/snippet}
				</BaseCard>
			{/if}

			<!-- Reconnect Suggestions Widget -->
			{#if insights.reconnect_suggestions.length > 0}
				<BaseCard>
					{#snippet children()}
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title">Consider Reconnecting</h2>
							<span class="text-xs opacity-60">
								<Sparkles gradient={true} />
							</span>
						</div>
						<div class="space-y-3">
							{#each insights.reconnect_suggestions as suggestion}
								<a
									href={`/contacts/${suggestion.contact_id}`}
									class="flex flex-col gap-2 rounded-lg border border-base-300 p-3 transition-colors hover:border-primary hover:bg-base-200"
								>
									<div class="flex items-center justify-between">
										<div class="font-medium">
											{suggestion.contact_name}
										</div>
										<div class="badge badge-ghost badge-sm">
											{#if suggestion.reason === 'Start building this relationship'}
												Added {suggestion.days_since_contact} days ago
											{:else}
												{suggestion.days_since_contact} days ago
											{/if}
										</div>
									</div>
									<div class="text-xs opacity-70">
										{suggestion.reason}
									</div>
								</a>
							{/each}
						</div>
					{/snippet}
				</BaseCard>
			{/if}
		</div>
	{/if}
{/if}

<!-- Activity Section -->
{#if activity_query.error || preferences_query.error}
	<div class="alert alert-error">
		<p>Error loading activity. Please try again.</p>
	</div>
{:else if (activity_query.loading || preferences_query.loading) && (activity_query.current === undefined || preferences_query.current === undefined)}
	<!-- Only show loading spinner on initial load -->
	<div class="flex justify-center p-8">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:else if activity_query.current && preferences_query.current}
	{@const activity = activity_query.current}
	{@const preferences = preferences_query.current}
	<div
		class="grid gap-6 lg:grid-cols-2"
		class:opacity-60={activity_query.loading}
	>
		<!-- Overdue Follow-ups (if any) -->
		{#if activity.overdue_follow_ups.length > 0}
			<BaseCard class="border-2 border-warning lg:col-span-2">
				{#snippet children()}
					<div class="mb-4 flex items-center justify-between">
						<h2
							class="card-title flex items-center gap-2 text-warning"
						>
							<Warning size="20px" />
							Overdue Follow-ups
						</h2>
						<a
							href="/follow-ups?filter=overdue"
							class="link link-warning"
						>
							View all
						</a>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each activity.overdue_follow_ups as follow_up}
							{#await get_follow_up_context(follow_up.contact_id) then context}
								<FollowUpCard
									{follow_up}
									date_format={preferences?.date_format ??
										'YYYY-MM-DD'}
									variant="dashboard"
									{context}
								/>
							{/await}
						{/each}
					</div>
				{/snippet}
			</BaseCard>
		{/if}

		<!-- Upcoming Follow-ups -->
		<BaseCard>
			{#snippet children()}
				<div class="mb-4 flex items-center justify-between">
					<h2 class="card-title">Upcoming Follow-ups</h2>
					<a href="/follow-ups" class="link text-sm link-primary">
						View all
					</a>
				</div>
				{#if activity.upcoming_follow_ups.length === 0}
					<EmptyState message="No upcoming follow-ups" />
				{:else}
					<div class="space-y-3">
						{#each activity.upcoming_follow_ups as follow_up}
							{#await get_follow_up_context(follow_up.contact_id) then context}
								<FollowUpCard
									{follow_up}
									date_format={preferences?.date_format ??
										'YYYY-MM-DD'}
									variant="compact"
									{context}
								/>
							{/await}
						{/each}
					</div>
				{/if}
			{/snippet}
		</BaseCard>

		<!-- Recent Interactions -->
		<BaseCard>
			{#snippet children()}
				<div class="mb-4 flex items-center justify-between">
					<h2 class="card-title">Recent Interactions</h2>
					<a href="/interactions" class="link text-sm link-primary">
						View all
					</a>
				</div>
				{#if activity.recent_interactions.length === 0}
					<EmptyState message="No interactions yet" />
				{:else}
					<div class="space-y-3">
						{#each activity.recent_interactions as interaction}
							<InteractionCard
								{interaction}
								date_format={preferences?.date_format ?? 'YYYY-MM-DD'}
								variant="compact"
							/>
						{/each}
					</div>
				{/if}
			{/snippet}
		</BaseCard>
	</div>
{/if}
