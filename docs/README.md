# Devhub CRM - Documentation

Complete documentation for developers and LLMs working on this
project.

## Product Strategy & Vision

### [product-vision.md](./product-vision.md)

**Start here for product direction**

Current state (6/10 → 9/10 roadmap), competitive analysis, target
users, success metrics, strategic moats.

### [feature-roadmap.md](./feature-roadmap.md)

**Complete feature list & prioritization**

All 37 features numbered and organized by phase. GitHub integration,
CLI, AI/agents, viral growth, infrastructure.

### [monetization.md](./monetization.md)

**Pricing strategy & business model**

Free vs Pro vs Premium tiers, revenue projections, upgrade triggers,
freemium vs open core models.

### [github-integration.md](./github-integration.md)

**GitHub automation features**

Activity tracking, auto-create contacts from stars, relationship
graph, skill auto-tagging, rate limiting strategy.

### [cli-tool.md](./cli-tool.md)

**Command-line tool specification**

All CLI commands, usage examples, terminal dashboard, scripting &
pipes, integration with main app.

### [ai-features.md](./ai-features.md)

**AI & agent features**

Three tiers (Analysis → Automation → Agents), relationship insights,
message drafting, daily digest, GitHub activity agent.

### [vector-search.md](./vector-search.md)

**Vector search with sqlite-vec**

Semantic search foundation, embedding model, cost analysis, features
enabled (semantic search, smart context, similar contacts, topic
clustering).

### [public-profiles.md](./public-profiles.md)

**Viral growth via public profiles**

Profile system, QR codes, "Add to CRM" viral loop, conference
strategy, analytics, growth projections.

### [growth-strategy.md](./growth-strategy.md)

**Go-to-market & acquisition**

Viral loops, conference strategy, Product Hunt launch, open source,
content marketing, metrics to track.

### [technical-architecture.md](./technical-architecture.md)

**System architecture & infrastructure**

Database schema additions, background jobs, GitHub OAuth, profile
system, GitHub API integration, AI stack, CLI architecture,
deployment, scaling.

---

## Core Patterns

This project uses modern SvelteKit + Svelte 5 patterns with minimal
boilerplate:

- **Remote Functions** (`*.remote.ts`) - Type-safe client-server
  communication
- **Batched Queries** (`query.batch()`) - Automatic request batching
  for parameterized queries
- **Raw SQL** - No ORM, direct SQLite queries with better-sqlite3
- **Better Auth** - Authentication without hooks.server.ts
- **Error Boundaries** - Graceful error handling at component level
- **Await Expressions** - Direct async/await in markup
- **Svelte 5 Runes** - `$state`, `$derived`, and `page` from
  `$app/state`

## Documentation Files

### Core Patterns

#### [remote-functions.md](./remote-functions.md)

**Practical reference for remote functions**

Quick start, query/form/command patterns, schema validation, refresh
strategies.

#### [remote-functions-deep-dive.md](./remote-functions-deep-dive.md)

**Complete guide to remote functions**

Why they exist, the four types (query/form/command/prerender),
single-flight mutations, async Svelte integration, caching,
authentication patterns. Based on Svelte Radio interview with core
team.

#### [database-pattern.md](./database-pattern.md)

**Database operations**

Raw SQL queries, parameterized queries, transactions, type safety.

#### [migrations.md](./migrations.md)

**Database migrations**

Migration system, creating migrations, tracking, best practices,
workflow.

#### [error-handling.md](./error-handling.md)

**Error handling & loading**

Error boundaries, await expressions, loading states, form errors.

### Authentication

#### [auth-setup.md](./auth-setup.md)

**Better Auth installation & config**

Install dependencies, configure auth, generate schema, environment
variables, helpers.

#### [auth-usage.md](./auth-usage.md)

**Auth patterns & usage**

Registration, login, logout, protected routes, component patterns,
layout guards.

#### [profile-settings.md](./profile-settings.md)

**User profile management**

Personal information, public profile, social links, QR codes, privacy
controls, GitHub integration.

### Forms

#### [forms-daisy-ui-v5.md](./forms-daisy-ui-v5.md)

**daisyUI v5 patterns (start here)**

Critical v4→v5 changes, basic structure, validation, error handling,
common mistakes.

#### [forms-inputs.md](./forms-inputs.md)

**Input types reference**

Complete guide to all input types: text, email, password, textarea,
select, checkbox, radio, file, etc.

### Design System

#### [styling.md](./styling.md)

**Visual design system & DaisyUI guidelines**

Background hierarchy, border system, text sizes, opacity modifiers,
semantic colors, shadows, spacing, contrast rules. Critical reference
for maintaining visual consistency.

### External Integrations

#### [integrations.md](./integrations.md)

**Third-party integrations**

GitHub contact import, API patterns, rate limits, future enhancements.

### Deployment

#### [deployment.md](./deployment.md)

**Production deployment**

ORIGIN variable (critical!), native modules, Vite SSR, Coolify/Docker,
troubleshooting.

## Quick Start Checklist

When implementing a new feature:

1. ✅ Create `*.remote.ts` file for server logic
2. ✅ Use `query.batch()` only for actual batching (N+1 problems)
3. ✅ Use raw SQL queries with prepared statements
4. ✅ Add error boundary in component
5. ✅ Use `await` directly in markup (requires `async: true` flag)
6. ✅ Add type definitions for database rows
7. ✅ Use `page` from `$app/state` for route params (Svelte 5)
8. ✅ Use single-flight mutations (call `.refresh()` in form/command
   handlers)

## Key Principles

1. **No hooks.server.ts** - Use `getRequestEvent()` in remote
   functions
2. **No +page.server.ts** - Use remote functions instead
3. **No ORM** - Raw SQL with better-sqlite3
4. **No API routes** - Remote functions handle everything
5. **Use query.batch()** - Only for actual batching (N+1 prevention),
   not all parameterized queries
6. **Use $app/state** - Not $app/stores (deprecated in Svelte 5)
7. **Type safety everywhere** - TypeScript for all database
   operations, use proper types instead of `any`
8. **Single-flight mutations** - Call `.refresh()` in form/command
   handlers for performance
9. **Enable async flag** - Set `experimental: { async: true }` in
   config for Boundary components
10. **Proper reactivity** - Use `.refresh()` on queries, never
    `window.location.reload()`
11. **Shared utilities** - Extract reusable functions to `lib/utils/`
12. **snake_case for functions/variables** - Use snake_case naming
13. **kebab-case for file names** - Use kebab-case for all file names
14. **lang="ts" in Svelte files** - Always use TypeScript in
    components

## Tech Stack

- **Frontend**: SvelteKit + Svelte 5 + Tailwind v4 + daisyUI v5
- **Database**: SQLite (better-sqlite3)
- **Auth**: Better Auth
- **Validation**: Valibot
- **Hosting**: Coolify

## Configuration

### Required: Enable Experimental Features

```javascript
// svelte.config.js
export default {
	kit: {
		experimental: {
			remoteFunctions: true, // ✅ Required for remote functions
			async: true, // ✅ Required for Boundary components & top-level await
		},
	},
};
```

**Why `async: true` matters:**

- Enables top-level `await` in components
- Provides Boundary components for coordinated loading states
- Prevents multiple loading spinners (better UX)
- Required for proper remote function usage

## File Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── db.ts              # Database instance
│   │   ├── auth.ts            # Better Auth setup
│   │   └── auth-helpers.ts    # Auth helper functions
│   ├── types/
│   │   └── db.ts              # Database type definitions
│   └── utils/
│       └── date-helpers.ts    # Shared utility functions
└── routes/
    ├── (app)/                 # Protected routes layout
    │   ├── contacts/
    │   │   ├── contacts.remote.ts       # Server functions with query.batch()
    │   │   ├── +page.svelte             # Contacts list
    │   │   ├── new/
    │   │   │   └── +page.svelte         # Create contact form
    │   │   └── [id]/
    │   │       ├── +page.svelte         # Contact detail (with interactions)
    │   │       └── edit/
    │   │           └── +page.svelte     # Edit contact form
    │   ├── interactions/
    │   │   ├── interactions.remote.ts   # Interaction CRUD + batched queries
    │   │   ├── +page.svelte             # Interactions list with filters
    │   │   └── new/
    │   │       └── +page.svelte         # Log interaction form
    │   ├── follow-ups/
    │   │   ├── follow-ups.remote.ts     # Follow-up CRUD + batched queries
    │   │   ├── +page.svelte             # Follow-ups list with filters
    │   │   └── new/
    │   │       └── +page.svelte         # Create follow-up form
    │   ├── settings/
    │   │   ├── settings.remote.ts       # User preferences management
    │   │   └── +page.svelte             # Settings page (date format, etc.)
    │   └── dashboard/
    │       ├── dashboard.remote.ts      # Dashboard queries
    │       └── +page.svelte             # Dashboard UI
    └── (auth)/                # Public auth routes layout
        ├── login/
        │   └── +page.svelte             # Login form
        └── register/
            └── +page.svelte             # Register form
```

## Common Tasks

### Add a new database table

1. Create migration in `migrations/`
2. Add TypeScript interface in `lib/types/db.ts`
3. Create `*.remote.ts` with queries using `query.batch()`

### Add a protected route

1. Use `guarded_query` or `guarded_form` from auth-helpers.ts
2. Wrap component in error boundary
3. Handle redirects in remote function

### Add a form

1. Create form function with valibot schema
2. Use `{...form_function}` spread in component
3. Handle errors with error boundary

### Add a query with parameters

1. Use `query.batch()` with valibot schema for validation
2. Batch database queries for efficiency
3. Return lookup function from batch handler
4. Call with parameters in component:
   `{#await get_item(id) then item}`

### Access route parameters

1. Import `page` from `$app/state` (not `$app/stores`)
2. Use `$derived()` to create reactive param:
   `const id = $derived(page.params.id)`
3. Guard with `{#if id}` before passing to queries

### Trigger re-fetch after mutations

**Best Practice: Single-Flight Mutations**

Call `.refresh()` on queries from within form/command handlers to
refresh data in the same request (no extra round trip):

```typescript
// contacts.remote.ts
export const delete_contact = command(v.string(), async (id) => {
	const user_id = await get_current_user_id();
	await db.delete('contacts', id, user_id);

	// ✅ Refresh in same request (single-flight mutation)
	await get_contacts.refresh();

	return { success: true };
});
```

**Why this is better:**

- Without: 2 round trips (mutation + separate refresh)
- With: 1 round trip (mutation with embedded refresh data)

**Default behaviors:**

- **Forms**: Automatically refresh ALL queries on page
- **Commands**: Refresh NOTHING by default (must explicitly call
  `.refresh()`)

**Never use `window.location.reload()`** - It's an anti-pattern that:

- Loses scroll position
- Clears component state
- Provides poor UX
- Defeats Svelte's reactivity

### Use shared utilities

For code used across multiple components:

1. Create utility files in `lib/utils/`
2. Export functions with clear names
3. Import with `$lib` alias:
   ```svelte
   import {(format_due_date, is_overdue)} from
   '$lib/utils/date-helpers';
   ```

**Example utilities:**

- `date-helpers.ts` - Date and time formatting functions
  - `format_date(date, format)` - Format dates according to user
    preference
  - `format_due_date(timestamp, format)` - Format due dates with
    "Today"/"Tomorrow" labels
  - `format_time(date, format)` - Format times in 12h or 24h format
  - `format_datetime(date, dateFormat, timeFormat)` - Format date and
    time together
  - `is_overdue(timestamp)` - Check if a date is in the past
  - Supports date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`
  - Supports time formats: `12h`, `24h`
  - Get user's preferences from `get_user_preferences()` in
    `settings.remote.ts`
- Type helpers, validation utilities, formatters, etc.

### User Preferences

User preferences are stored per-user and automatically applied
throughout the app:

**Appearance:**

- `theme` - Application color theme (stored in localStorage and
  cookie, 37 daisyUI themes available)

**Date & Time:**

- `date_format` - How dates are displayed (YYYY-MM-DD, MM/DD/YYYY,
  DD/MM/YYYY)
- `time_format` - How times are displayed (12h or 24h)

**Defaults:**

- `default_contact_sort` - How contacts are sorted by default (name,
  last_contacted, recently_added, company)
- `default_follow_up_days` - Days from today for new follow-up due
  dates (1-90)
- `default_interaction_type` - Pre-selected type when logging
  interactions (meeting, call, email, message, or none)

Access via `get_user_preferences()` from `settings.remote.ts`.

### Theming

The application supports 37 daisyUI themes that can be selected from
the Settings page:

**Implementation:**

- Theme selection is stored in `localStorage` (client-side
  persistence)
- Theme is also stored in a cookie (server-side rendering support)
- Theme is applied via `data-theme` attribute on `<html>` element
- Available themes are defined in `$lib/themes/index.ts`

**How it works:**

1. User selects theme from Settings page
2. Theme is saved to `localStorage` and cookie (1 year expiry)
3. `data-theme` attribute is set on document root
4. daisyUI CSS variables update automatically
5. On page load, theme is restored from `localStorage` via `$effect()`

**Location:** Theme selector is in `/settings` page, integrated with
other user preferences.

### Add a feature with list/detail/create pages (like interactions)

1. **Create remote functions file** (e.g., `interactions.remote.ts`)
   - Use `query.batch()` for getting items by contact_id
   - Create `get_all_*` query for list page (no parameters)
   - Use `guarded_form` for create/update forms
   - Add redirect after successful form submission

2. **Create list page** (`+page.svelte`)
   - Import query functions
   - Use `{#await}` for data loading
   - Add filters with `$state` if needed
   - Link to create page

3. **Create form page** (`new/+page.svelte`)
   - Use `{...form_function}` spread on `<form>`
   - Support pre-fill via URL params:
     `page.url.searchParams.get('param')`
   - Use proper form patterns (see forms-pattern.md)
   - Remember: `<textarea>` doesn't use label wrapper in daisyUI v5

4. **Integrate with related pages**
   - Add section to detail pages showing related items
   - Add "Create" button with pre-filled params
   - Use batched queries to avoid N+1 problems

## Official Docs

- [Svelte 5 Docs](https://svelte.dev/docs)
- [SvelteKit Remote Functions](https://svelte.dev/docs/kit/remote-functions)
- [Better Auth](https://better-auth.com)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
