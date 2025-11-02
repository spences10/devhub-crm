# The `.current` Property

The `.current` property retains previous data during refresh, enabling
smooth in-place updates without page jumps.

## The Problem: Page Jumps with `{#await}`

When using `{#await query()}` with `.refresh()`, Svelte re-renders the
entire block, causing:

- **Page scrolls to top** - User loses their scroll position
- **Content disappears then reappears** - Jarring visual flash
- **Component state is lost** - Edit forms reset, selections clear
- **Component structure recreated** - Expensive DOM operations

## The Solution: `.current` Property

Store the query in a variable and access `.current` to:

- **Keep previous data visible** during refresh
- **Preserve scroll position** - No component recreation
- **Maintain component state** - Forms, selections stay intact
- **Show subtle loading indicators** - Optional opacity instead of full
  spinner

## Query Object Properties

```typescript
const query = get_data();

query.loading; // boolean - true when fetching
query.error; // Error | null - error state
query.current; // T | undefined - persists during refresh!
```

## The Three States

1. **Initial load** (`.current === undefined` + `.loading === true`):
   - Show full loading spinner
   - No previous data available
   - User expects to wait

2. **During refresh** (`.current` has data + `.loading === true`):
   - Keep showing previous data
   - Add optional opacity-60 to indicate loading
   - User can continue interacting with current data

3. **After refresh** (`.current` updated + `.loading === false`):
   - Display fresh data
   - Remove loading indicator
   - Smooth transition - no page jump

## ❌ Bad Pattern: Using `{#await}` for Inline Editing

```svelte
<script lang="ts">
	import { get_interactions, update_interaction } from './interactions.remote';

	let edit_id = $state<string | null>(null);

	async function save_edit() {
		await update_interaction({ id: edit_id, ... });
		edit_id = null;
		await get_interactions().refresh(); // ⚠️ Causes page jump!
	}
</script>

<!-- ❌ Re-renders entire block on .refresh() -->
{#await get_interactions() then interactions}
	{#each interactions as interaction}
		{#if edit_id === interaction.id}
			<input bind:value={interaction.note} />
			<button onclick={save_edit}>Save</button>
		{:else}
			<p>{interaction.note}</p>
			<button onclick={() => edit_id = interaction.id}>Edit</button>
		{/if}
	{/each}
{/await}
```

**What happens on save:**

1. User clicks Save
2. `.refresh()` is called
3. Entire `{#await}` block re-renders from scratch
4. Page jumps to top (scroll position lost)
5. Edit form disappears then reappears
6. Jarring UX - feels like page reload

## ✅ Good Pattern: Using `.current` Property

```svelte
<script lang="ts">
	import { get_interactions, update_interaction } from './interactions.remote';

	// Store query in variable to access .current
	const interactions_query = get_interactions();

	let edit_id = $state<string | null>(null);

	async function save_edit() {
		await update_interaction({ id: edit_id, ... });
		edit_id = null;
		await interactions_query.refresh(); // ✅ Smooth in-place update!
	}
</script>

<!-- ✅ Only show spinner on INITIAL load -->
{#if interactions_query.error}
	<p>Error loading interactions</p>
{:else if interactions_query.loading && interactions_query.current === undefined}
	<p>Loading interactions...</p>
{:else}
	{@const interactions = interactions_query.current ?? []}

	<!-- Subtle opacity during refresh, content stays visible -->
	<div class:opacity-60={interactions_query.loading}>
		{#each interactions as interaction}
			{#if edit_id === interaction.id}
				<input bind:value={interaction.note} />
				<button onclick={save_edit}>Save</button>
			{:else}
				<p>{interaction.note}</p>
				<button onclick={() => edit_id = interaction.id}>Edit</button>
			{/if}
		{/each}
	</div>
{/if}
```

**What happens on save:**

1. User clicks Save
2. `.refresh()` is called
3. Content stays visible with opacity-60
4. Data updates in place - no scroll jump
5. Smooth transition to updated content
6. Great UX - feels instant and responsive

## Why `.current` is Better

| Aspect                | `{#await}`                          | `.current`                                 |
| --------------------- | ----------------------------------- | ------------------------------------------ |
| **Scroll position**   | Lost - scrolls to top               | Preserved - stays in place                 |
| **Content visibility** | Hides then shows (flash)            | Always visible                             |
| **Component state**   | Lost - inputs reset                 | Preserved - forms stay intact              |
| **Loading indicator** | Full spinner blocks content         | Subtle opacity, content accessible         |
| **User experience**   | Feels like page reload              | Feels smooth and responsive                |
| **DOM operations**    | Recreates entire component tree     | Updates in place                           |
| **Edit state**        | Lost during refresh                 | Maintained during refresh                  |

## When to Use `.current`

**Always use `.current` for:**

- **Inline editing** - Forms within lists
- **Real-time updates** - Data that refreshes frequently
- **Infinite scroll** - Adding items to existing list
- **Optimistic UI** - Immediate feedback before server confirmation
- **Search/filter** - Updating results without hiding current data
- **Dashboards** - Multiple widgets that refresh independently

**Can use `{#await}` for:**

- **Initial page load** - No previous state to preserve
- **Full page navigation** - User expects full transition
- **Modal content** - Isolated from main page scroll

## Complete Pattern Example

```svelte
<script lang="ts">
	import { get_contacts, update_contact, delete_contact } from './contacts.remote';

	const contacts_query = get_contacts();
	let editing_id = $state<string | null>(null);
	let edit_name = $state('');

	function start_edit(contact: Contact) {
		editing_id = contact.id;
		edit_name = contact.name;
	}

	async function save_edit() {
		if (!editing_id) return;
		await update_contact({ id: editing_id, name: edit_name });
		editing_id = null;
		await contacts_query.refresh(); // Smooth update!
	}

	async function handle_delete(id: string) {
		if (!confirm('Delete contact?')) return;
		await delete_contact(id);
		await contacts_query.refresh(); // Smooth update!
	}
</script>

{#if contacts_query.error}
	<div class="alert alert-error">
		<p>Failed to load contacts: {contacts_query.error.message}</p>
		<button onclick={() => contacts_query.refresh()}>Retry</button>
	</div>
{:else if contacts_query.loading && contacts_query.current === undefined}
	<!-- Only show full spinner on initial load -->
	<div class="flex items-center gap-2">
		<span class="loading loading-spinner"></span>
		<span>Loading contacts...</span>
	</div>
{:else}
	{@const contacts = contacts_query.current ?? []}

	<!-- Subtle loading indicator during refresh -->
	<div class:opacity-60={contacts_query.loading}>
		{#each contacts as contact (contact.id)}
			<div class="card bg-base-100 p-4 shadow-md">
				{#if editing_id === contact.id}
					<!-- Edit mode -->
					<input
						bind:value={edit_name}
						class="input w-full"
					/>
					<div class="flex gap-2 mt-2">
						<button class="btn btn-primary btn-sm" onclick={save_edit}>
							Save
						</button>
						<button class="btn btn-ghost btn-sm" onclick={() => editing_id = null}>
							Cancel
						</button>
					</div>
				{:else}
					<!-- View mode -->
					<p class="text-lg font-semibold">{contact.name}</p>
					<div class="flex gap-2 mt-2">
						<button class="btn btn-ghost btn-sm" onclick={() => start_edit(contact)}>
							Edit
						</button>
						<button class="btn btn-error btn-sm" onclick={() => handle_delete(contact.id)}>
							Delete
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Optional: Show refresh indicator -->
	{#if contacts_query.loading}
		<div class="mt-2 text-sm opacity-60">
			Refreshing...
		</div>
	{/if}
{/if}
```

## Key Takeaways

1. **Store queries in variables** - `const query = get_data()` enables
   `.current` access
2. **Check `.current === undefined`** - Only show spinner on initial
   load
3. **Use opacity during refresh** - Keep content visible and accessible
4. **Preserve user state** - Forms, selections, scroll position all
   maintained
5. **Better UX** - Smooth transitions instead of jarring page jumps
