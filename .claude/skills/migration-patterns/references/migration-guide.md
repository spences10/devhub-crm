# Migration Guide

Complete guide for creating and managing database migrations.

## How It Works

This project uses a dual approach for database schema management:

1. **Base schema** (`schema.sql`) - The complete database schema, run
   on every startup
2. **Migrations** (`migrations/*.sql`) - Incremental changes tracked
   and run once

On application startup (via `hooks.server.ts`):

1. The base `schema.sql` is executed (all tables use `IF NOT EXISTS`)
2. The migration runner checks for pending migrations in the
   `migrations/` folder
3. Each migration is run once and tracked in the `migrations` table

## Creating a Migration

Migrations are numbered SQL files in the `migrations/` folder:

```
migrations/
  001_add_tags.sql
  002_add_user_preferences.sql
  003_add_profile_views.sql
```

### Naming Convention

- Format: `{number}_{description}.sql`
- Numbers should be zero-padded (001, 002, 003)
- Use descriptive names (add_tags, modify_contacts, etc.)
- Files are run in alphabetical order

### Migration Template

```sql
-- Migration: {Description}
-- Created: {Date}
-- Description: {What this migration does}

-- Your SQL here
CREATE TABLE IF NOT EXISTS example (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_example_id ON example(id);
```

## Complete Example: Tags Migration

File: `migrations/001_add_tags.sql`

```sql
-- Migration: Add Tags Feature
-- Created: 2025-10-12
-- Description: Adds tags table and contact_tags junction table for tagging contacts

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Contact tags junction table
CREATE TABLE IF NOT EXISTS contact_tags (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(contact_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);
```

## Migration Tracking

The system tracks applied migrations in a `migrations` table:

```sql
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL
)
```

Each migration file name is stored when applied, preventing duplicate
runs.

## Best Practices

1. **Always use IF NOT EXISTS** - Makes migrations safe to re-run
2. **One feature per migration** - Keep migrations focused
3. **Include indexes** - Add indexes in the same migration as tables
4. **Test locally first** - Verify the migration works before
   committing
5. **Never modify existing migrations** - Create a new migration
   instead
6. **Update schema.sql** - Keep the base schema in sync with
   migrations

## Workflow

When adding a new database feature:

1. **Create migration file**

   ```bash
   # Create migrations/00X_feature_name.sql
   # Add your CREATE TABLE, ALTER TABLE, etc.
   ```

2. **Update schema.sql**

   ```bash
   # Add the same changes to schema.sql
   # This ensures new databases have the complete schema
   ```

3. **Test locally**

   ```bash
   npm run dev
   # Check console for "Applying X migration(s)..." message
   ```

4. **Commit both files**
   ```bash
   git add migrations/00X_feature_name.sql schema.sql
   git commit -m "feat: add feature_name to database"
   ```

## Migration Runner Code

The migration runner is in `src/lib/server/migrate.ts` and:

- Creates a `migrations` table to track applied migrations
- Reads all `.sql` files from the `migrations/` folder
- Sorts them alphabetically
- Runs pending migrations in a transaction
- Records each migration in the tracking table

It's called automatically on startup in `hooks.server.ts`.
