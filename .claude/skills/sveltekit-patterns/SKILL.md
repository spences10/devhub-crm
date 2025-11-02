---
name: sveltekit-patterns
# prettier-ignore
description: SvelteKit patterns for devhub-crm. Use for remote functions (query, form, command), routing, and server-side logic.
---

# SvelteKit Patterns

## Quick Start

```typescript
// src/routes/contacts.remote.ts
import { query, form, command } from '$app/server';
import * as v from 'valibot';

// Query: Fetch data (supports batching)
export const get_contacts = query(async () => {
	return db
		.prepare('SELECT * FROM contacts WHERE user_id = ?')
		.all(user_id);
});

// Form: Validated mutations with redirects
export const create_contact = form(
	v.object({
		name: v.string(),
		email: v.pipe(v.string(), v.email()),
	}),
	async ({ name, email }) => {
		db.prepare('INSERT INTO contacts ...').run(id, name, email);
		redirect(303, '/contacts');
	},
);

// Command: Mutations without redirects
export const delete_contact = command(v.string(), async (id) => {
	db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
	return { success: true };
});
```

## Core Principles

- **Remote functions**: `query` (read), `form` (mutations +
  redirects), `command` (mutations only)
- **Validation**: Use valibot schemas for all remote functions
- **Security**: Include `user_id` in all queries (row-level security)
- **API routes**: Use `+server.ts` for REST endpoints
- **Optimization**: Use `query.batch()` for N+1 prevention

## Reference Files

- [remote-functions.md](references/remote-functions.md) - Complete
  remote functions API
- [routing.md](references/routing.md) - File-based routing patterns
- [database-patterns.md](references/database-patterns.md) - Advanced
  database queries
