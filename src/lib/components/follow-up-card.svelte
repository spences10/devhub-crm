<script lang="ts">
	import CompactItem from '#lib/components/compact-item.svelte';
	import type { FollowUp } from '#lib/types/db.ts';
	import {
		type DateFormat,
		format_due_date,
		is_overdue,
	} from '#lib/utils/date-helpers.ts';
	import { Button } from './ui';

	interface Props {
		follow_up: FollowUp & {
			contact_name?: string;
			contact_id?: string;
		};
		date_format: DateFormat;
		variant?: 'full' | 'compact' | 'dashboard';
		context?: Array<{ note: string; type: string }>;
		on_complete?: (id: string) => void;
		on_reopen?: (id: string) => void;
		on_delete?: (id: string) => void;
	}

	let {
		follow_up,
		date_format,
		variant = 'full',
		context,
		on_complete,
		on_reopen,
		on_delete,
	}: Props = $props();

	const overdue = $derived(
		variant !== 'dashboard' &&
			!follow_up.completed &&
			is_overdue(follow_up.due_date),
	);
</script>

{#if variant === 'dashboard'}
	<!-- Dashboard compact version (used in overdue section) -->
	<CompactItem variant="elevated" href={null}>
		{#snippet header()}
			<div class="flex flex-1 flex-col gap-1">
				{#if follow_up.contact_id && follow_up.contact_name}
					<a
						href="/contacts/{follow_up.contact_id}"
						class="link font-semibold link-hover"
					>
						{follow_up.contact_name}
					</a>
				{/if}
				<p class="text-sm text-error">
					Due: {format_due_date(follow_up.due_date, date_format)}
				</p>
			</div>
			{#if follow_up.contact_id}
				<a
					href="/contacts/{follow_up.contact_id}"
					class="inline-block"
				>
					<Button variant="error" size="sm">View</Button>
				</a>
			{/if}
		{/snippet}

		{#if follow_up.note}
			{#snippet body()}
				<p class="text-sm opacity-80">
					{follow_up.note}
				</p>
			{/snippet}
		{/if}

		{#if context && context.length > 0}
			{#snippet footer()}
				<div class="w-full border-t border-base-300 pt-2">
					<p class="mb-1 text-xs font-medium opacity-60">
						Last discussed:
					</p>
					<div class="flex flex-wrap gap-1">
						{#each context.slice(0, 3) as ctx}
							<span class="badge badge-ghost badge-xs">
								{ctx.type}
							</span>
						{/each}
					</div>
				</div>
			{/snippet}
		{/if}
	</CompactItem>
{:else if variant === 'compact'}
	<!-- Compact version (used in dashboard upcoming section) -->
	<CompactItem
		href={follow_up.contact_id
			? `/contacts/${follow_up.contact_id}`
			: null}
		heading={follow_up.contact_name}
		note={follow_up.note}
	>
		{#snippet metadata()}
			<p class="text-sm opacity-70">
				{format_due_date(follow_up.due_date, date_format)}
			</p>
		{/snippet}
		{#snippet extra_content()}
			{#if context && context.length > 0}
				<div class="mt-2 flex flex-wrap gap-1">
					{#each context.slice(0, 2) as ctx}
						<span class="badge badge-ghost badge-xs">
							{ctx.type}
						</span>
					{/each}
				</div>
			{/if}
		{/snippet}
	</CompactItem>
{:else}
	<!-- Full version (used in follow-ups list and contact detail) -->
	<CompactItem variant="default" href={null}>
		{#snippet header()}
			<div>
				<span class="text-sm font-medium" class:text-error={overdue}>
					{format_due_date(follow_up.due_date, date_format)}
				</span>
				{#if overdue}
					<span class="ml-2 badge badge-sm badge-error">
						Overdue
					</span>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if on_complete && !follow_up.completed}
					<Button
						variant="success"
						size="xs"
						onclick={() => on_complete?.(follow_up.id)}
					>
						Complete
					</Button>
				{/if}
				{#if on_reopen && follow_up.completed}
					<Button
						variant="outline"
						size="xs"
						onclick={() => on_reopen?.(follow_up.id)}
					>
						Reopen
					</Button>
				{/if}
				{#if on_delete}
					<Button
						variant="error"
						size="xs"
						onclick={() => on_delete?.(follow_up.id)}
					>
						Delete
					</Button>
				{/if}
			</div>
		{/snippet}

		{#if follow_up.note}
			{#snippet body()}
				<p class="text-sm whitespace-pre-wrap">
					{follow_up.note}
				</p>
			{/snippet}
		{/if}
	</CompactItem>
{/if}
