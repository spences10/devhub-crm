# Remote Functions Reference

Complete API documentation for SvelteKit remote functions used in
devhub-crm.

## Overview

Remote functions provide type-safe RPC between client and server with
automatic type inference.

## Function Types

### query

Read-only operations that fetch data.

**Basic usage:**

```typescript
export const get_items = query(async () => {
	return db.prepare('SELECT * FROM items').all();
});
```

**With validation:**

```typescript
export const get_item = query(
	v.pipe(v.string(), v.minLength(1)),
	async (id: string) => {
		return db.prepare('SELECT * FROM items WHERE id = ?').get(id);
	},
);
```

**Batching (N+1 optimization):**

```typescript
export const get_items = query.batch(
	v.string(), // Input validation schema
	async (ids: string[]) => {
		const items = db
			.prepare(
				`SELECT * FROM items WHERE id IN (${ids.map(() => '?').join(',')})`,
			)
			.all(...ids);

		// Return lookup function
		return (id: string) => items.find((item) => item.id === id);
	},
);
```

### form

Mutations with validation and redirects. Used for traditional form
submissions.

**Structure:**

```typescript
export const action_name = form(
	validationSchema,
	async (validatedData) => {
		// Mutation logic
		redirect(303, '/success-path');
	},
);
```

**Example:**

```typescript
export const create_contact = form(
	v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Name required')),
		email: v.pipe(v.string(), v.email('Invalid email')),
	}),
	async ({ name, email }) => {
		const event = getRequestEvent();
		const session = await auth.api.getSession({
			headers: event.request.headers,
		});

		const user_id = session?.user?.id;
		const id = nanoid();

		db.prepare(
			`
      INSERT INTO contacts (id, user_id, name, email, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
		).run(id, user_id, name, email, Date.now());

		redirect(303, '/contacts');
	},
);
```

**Error handling:**

```typescript
export const save_item = form(
	v.object({ name: v.string() }),
	async (data) => {
		try {
			// Mutation
		} catch (error) {
			return { error: error.message };
		}
		redirect(303, '/success');
	},
);
```

### command

Mutations that return data instead of redirecting. Used for AJAX-style
interactions.

**Basic usage:**

```typescript
export const delete_item = command(
	v.pipe(v.string(), v.minLength(1)),
	async (id: string) => {
		db.prepare('DELETE FROM items WHERE id = ?').run(id);
		return { success: true };
	},
);
```

**Complex return:**

```typescript
export const update_settings = command(
	v.object({
		theme: v.string(),
		notifications: v.boolean(),
	}),
	async (settings) => {
		// Save settings
		return {
			success: true,
			message: 'Settings saved',
			updated_at: Date.now(),
		};
	},
);
```

## Accessing Request Context

Use `getRequestEvent()` to access headers, cookies, URL params:

```typescript
import { getRequestEvent } from '$app/server';

export const my_function = query(async () => {
	const event = getRequestEvent();

	// Access headers
	const userAgent = event.request.headers.get('user-agent');

	// Access URL params
	const searchParam = event.url.searchParams.get('q');

	// Access session
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	return { userAgent, searchParam, user: session?.user };
});
```

## Client Usage

Remote functions are automatically available on the client:

```svelte
<script lang="ts">
	import {
		get_items,
		create_contact,
		delete_item,
	} from './functions.remote';

	// Query: Returns promise
	const items = get_items();

	// Form: Use with <form> element
	const { data, submitting, errors } = create_contact();

	// Command: Call programmatically
	async function handleDelete(id: string) {
		const result = await delete_item(id);
		if (result.success) {
			// Handle success
		}
	}
</script>

<!-- Form usage -->
<form method="POST" use:data>
	<input name="name" />
	<input name="email" type="email" />
	<button disabled={$submitting}>Create</button>
	{#if $errors.name}<span>{$errors.name}</span>{/if}
</form>

<!-- Query usage -->
{#await items}
	Loading...
{:then data}
	{#each data as item}
		<div>{item.name}</div>
	{/each}
{/await}
```

## Refreshing Data After Mutations

### Default Behaviors

- **Forms**: Automatically refresh ALL queries on the page (mirrors
  non-JS behavior)
- **Commands**: Refresh NOTHING by default (must explicitly opt-in)

### Single-Flight Mutation (Recommended for Performance)

Call `.refresh()` on queries from within the form/command handler to
refresh specific data in the same request:

```typescript
// contacts.remote.ts
export const get_contacts = query(async () => {
	const user_id = await get_current_user_id();
	return db.query('SELECT * FROM contacts WHERE user_id = ?', [
		user_id,
	]);
});

export const create_contact = form(
	v.object({
		name: v.string(),
		email: v.string(),
	}),
	async (data) => {
		const user_id = await get_current_user_id();
		await db.insert('contacts', { ...data, user_id });

		// ✅ Single-flight mutation: refresh in same request
		await get_contacts().refresh();

		return { success: true };
	},
);
```

**Why this is better:**

- **Without**: 2 round trips (mutation request + separate refresh
  request)
- **With**: 1 round trip (mutation with embedded refresh data in
  response)

### Alternative: Redirect After Save

If you redirect, the new page fetches fresh data automatically:

```typescript
export const create_contact = form(schema, async (data) => {
	const id = await db.insert('contacts', data);
	redirect(303, `/contacts/${id}`); // New page loads fresh data
});
```

**Trade-off:** Causes full page navigation but guarantees fresh data.

### Commands Must Return Values

**IMPORTANT:** Commands must return a value for `await` to properly
complete. Always return `{ success: true }` or an error object.

```typescript
export const delete_contact = command(
	v.string(),
	async (id) => {
		const user_id = await get_current_user_id();
		await db.query(
			'DELETE FROM contacts WHERE id = ? AND user_id = ?',
			[id, user_id],
		);

		// ✅ Explicitly refresh queries (commands don't refresh by default)
		await get_contacts().refresh();

		return { success: true }; // ✅ Required for proper async completion
	},
);
```

**Why return values matter:** Without a return value, the command may
not fully complete before the next operation, causing UI updates to
fail.

## Reactive UI Updates

**IMPORTANT:** When remote functions call `.refresh()`, components
update automatically. You do **NOT** need manual refresh triggers.

### Using `.current` for Non-Blocking Updates (Recommended)

**The Problem with `{#await}`:** When you use `{#await query()}` and
call `.refresh()`, it re-renders the entire block, causing scroll
jumps and visual disruption.

**The Solution:** Use the `.current` property to access data
non-blockingly. This keeps previous data visible while new data loads.

#### ❌ **BAD** - Blocking Pattern (Causes Page Jumps):

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
			<!-- edit form -->
			<button onclick={save_edit}>Save</button>
		{:else}
			<!-- view mode -->
		{/if}
	{/each}
{/await}
```

**Why this is bad:**

- Page scrolls to top when `.refresh()` is called
- Entire list disappears then reappears (jarring UX)
- Edit state is lost during re-render
- Component structure is completely recreated

#### ✅ **GOOD** - Non-Blocking Pattern with `.current`:

```svelte
<script lang="ts">
	import { get_interactions, update_interaction } from './interactions.remote';

	// Store query in a variable
	const interactions_query = get_interactions();

	let edit_id = $state<string | null>(null);

	async function save_edit() {
		await update_interaction({ id: edit_id, ... });
		edit_id = null;
		await interactions_query.refresh(); // ✅ Updates in place!
	}
</script>

<!-- ✅ Only show spinner on INITIAL load -->
{#if interactions_query.error}
	<p>Error loading data</p>
{:else if interactions_query.loading && interactions_query.current === undefined}
	<p>Loading...</p>
{:else}
	{@const interactions = interactions_query.current ?? []}

	<!-- Optional: Add subtle loading indicator during refresh -->
	<div class:opacity-60={interactions_query.loading}>
		{#each interactions as interaction}
			{#if edit_id === interaction.id}
				<!-- edit form -->
				<button onclick={save_edit}>Save</button>
			{:else}
				<!-- view mode -->
			{/if}
		{/each}
	</div>
{/if}
```

**Why this is better:**

- **`.current` retains previous data during refresh** - Unlike
  `await`, which re-renders everything, `.current` keeps showing the
  old data while loading new data
- **Scroll position preserved** - No component recreation means no
  scroll jump
- **Smooth updates** - Data updates in place without visual disruption
- **Better UX** - Optional `opacity-60` class shows loading state
  without hiding content
- **Initial load detection** - Check `.current === undefined` to show
  spinner only on first load

#### Key Properties of Query Objects:

```typescript
const query = get_data();

query.loading; // boolean - true when fetching
query.error; // Error | null - error state
query.current; // T | undefined - latest data (persists during refresh!)
```

**The pattern:**

1. **Initial load** (`.current === undefined`): Show loading spinner
2. **During refresh** (`.current` has data + `.loading === true`):
   Keep showing data with optional opacity
3. **After refresh**: New data in `.current`, `.loading` becomes false

This pattern is especially important for:

- Inline editing (prevents scroll jumps)
- Real-time updates
- Optimistic UI updates
- Anywhere you need smooth data transitions

### ❌ **DON'T** Do This (Manual Refresh Pattern):

```svelte
<script lang="ts">
	import { get_tags, create_tag } from './tags.remote';

	let refresh_key = $state(0); // ❌ Don't use manual refresh keys

	async function handle_create(name: string, color: string) {
		await create_tag({ name, color });
		refresh_key++; // ❌ Don't manually increment keys
	}
</script>

{#key refresh_key}
	<!-- ❌ Don't wrap queries in {#key} blocks -->
	{#await get_tags() then tags}
		<!-- content -->
	{/await}
{/key}
```

**Why this is wrong:**

- Forces complete re-render of the entire block
- Feels like a page reload
- Defeats reactive updates
- Creates visual flash/jarring UX

### ✅ **DO** This (Reactive Pattern):

```svelte
<script lang="ts">
	import { get_tags, create_tag } from './tags.remote';

	// No manual refresh state needed!

	async function handle_create(name: string, color: string) {
		await create_tag({ name, color });
		// That's it! Component updates automatically
	}
</script>

<!-- Just await the query directly - updates reactively when .refresh() is called -->
{#await get_tags() then tags}
	<!-- content -->
{/await}
```

**Why this works:**

- Your remote function calls `.refresh()` internally:
  ```typescript
  export const create_tag = guarded_command(schema, async (data) => {
  	await db.insert('tags', data);
  	await get_tags().refresh(); // ← This triggers UI update
  	return { success: true };
  });
  ```
- Component updates **in place** without re-rendering
- Smooth, reactive UI updates
- No visual flash or reload feeling

### Component Callbacks Are Unnecessary

**❌ DON'T** pass `on_change` callbacks to child components:

```svelte
<!-- ❌ Don't do this -->
<SocialLinksManager
	on_add={add_social_link}
	on_delete={delete_social_link}
	on_change={() => contact_query?.refresh()}  <!-- ❌ Unnecessary! -->
/>
```

**✅ DO** just call the remote functions directly:

```svelte
<!-- ✅ Just pass the remote functions -->
<SocialLinksManager
	on_add={add_social_link}
	on_delete={delete_social_link}
	<!-- No on_change needed! -->
/>
```

**Why this works:**

- Remote functions already call `.refresh()` internally
- Parent component updates reactively automatically
- Less boilerplate, cleaner code

## Client-Side Cache & Deduplication

Remote functions use a hidden client-side cache:

**Cache Key**: `remote_function_id + stringified_payload`

**Example**:

```svelte
<script>
	// Called 3 times across different components
	const user1 = await get_user('user-123'); // Fetches from server
	const user2 = await get_user('user-123'); // Cache hit!
	const user3 = await get_user('user-456'); // Different ID, fetches
</script>
```

**Benefits:**

- No need to hoist data loading to parent components
- Use queries wherever you need them
- Automatic deduplication across components
- Reduces network requests
- Reactive updates when `.refresh()` is called

## Best Practices

✅ **DO:**

- **Use `.current` pattern for inline editing** - Prevents page jumps
  and provides smooth updates
- **Store queries in variables** - `const query = get_data()` instead
  of calling inline
- **Show spinner only on initial load** - Check
  `.current === undefined` to avoid hiding content during refresh
- Let queries update reactively - no manual refresh keys needed
- Use `query.batch()` for actual batching (N+1 prevention)
- Always validate with schemas (endpoints are public!)
- Use auth helpers for consistent authentication
- Verify ownership in all mutations
- Return values from commands (`{ success: true }`)
- Call `.refresh()` inside form/command handlers for single-flight
  mutations

❌ **DON'T:**

- **Use `{#await}` for inline editing** - Causes page jumps and
  re-renders entire blocks
- **Hide content during refresh** - Show spinners only when
  `.current === undefined`
- Use manual refresh keys (`refresh_key++`) or `{#key}` blocks around
  queries
- Pass `on_change` callbacks to trigger manual refreshes
- Use `query.batch()` if you're not actually batching
- Forget that commands don't refresh by default
- Use `window.location.reload()` (defeats reactivity)
- Forget that remote functions are public endpoints
- Assume route-based protection works

## Examples from devhub-crm

See actual implementations in:

- `src/routes/auth.remote.ts` - Authentication flows
- `src/routes/@[username]/profile.remote.ts` - Profile queries with
  batching
- `src/routes/(app)/interactions/+page.svelte` - `.current` property
  usage for inline editing
- Database patterns skill for query construction
