# Migration Troubleshooting

Common issues and solutions when working with database migrations.

## Migration Not Running

**Symptoms:**
- Migration file exists but doesn't execute on startup
- No migration log messages in console
- Changes not applied to database

**Solutions:**

1. **Check file location**
   - File must be in `migrations/` folder at project root
   - Not in subdirectories

2. **Check file extension**
   - Must end with `.sql`
   - Not `.txt` or other extensions

3. **Check file name format**
   - Must start with a number (e.g., `001_`, `002_`)
   - Numbers should be zero-padded (001 not 1)
   - Use underscores, not spaces

4. **Check migration tracking table**
   ```sql
   SELECT * FROM migrations;
   ```
   - If migration name is listed, it already ran
   - Can't re-run without manual intervention

5. **Check console output**
   - Look for migration logs on startup
   - Check for error messages

## Migration Fails

**Symptoms:**
- Migration starts but fails with SQL error
- Application fails to start
- Database in inconsistent state

**Solutions:**

1. **Check SQL syntax**
   - Verify all SQL statements are valid SQLite syntax
   - Test queries manually in SQLite browser

2. **Check foreign key constraints**
   - Ensure referenced tables exist
   - Verify foreign key columns match types
   - Use `ON DELETE CASCADE` or `ON DELETE SET NULL`

3. **Check for missing IF NOT EXISTS**
   - Tables: `CREATE TABLE IF NOT EXISTS`
   - Indexes: `CREATE INDEX IF NOT EXISTS`

4. **Check for data type mismatches**
   - TEXT for IDs (using nanoid)
   - INTEGER for timestamps (Date.now())
   - INTEGER for booleans (0/1)

5. **Use transactions for complex migrations**
   ```sql
   BEGIN TRANSACTION;
   -- Multiple statements here
   COMMIT;
   ```

## Reset Migrations (Development Only)

**Warning:** This deletes all data. Only use in development.

To re-run all migrations from scratch:

```bash
# Delete the database
rm local.db

# Restart the app - schema.sql and all migrations will run
npm run dev
```

## Migration Already Exists Error

**Symptoms:**
- Error: "Migration XXX already applied"
- Need to modify an already-run migration

**Solution:**

**NEVER modify existing migrations.** Instead:

1. Create a new migration to make the change:
   ```sql
   -- migrations/004_modify_tags_table.sql
   ALTER TABLE tags ADD COLUMN description TEXT;
   ```

2. If in development and database can be reset:
   ```bash
   rm local.db
   npm run dev
   ```

## Migration Order Issues

**Symptoms:**
- Migration fails because it depends on another migration
- "Table doesn't exist" errors

**Solutions:**

1. **Check numbering**
   - Migrations run in alphabetical order
   - Ensure dependencies run first
   - Example: `001_create_users.sql` before `002_create_contacts.sql`

2. **Add missing migration**
   - If table missing, create migration with lower number
   - Or add to schema.sql and rebuild database

## Schema.sql Out of Sync

**Symptoms:**
- New databases missing tables that exist in migrated databases
- Different schema between fresh installs and migrated databases

**Solutions:**

1. **Always update both files**
   - When creating migration, also update schema.sql
   - Ensures new databases match migrated ones

2. **Verify schema.sql includes all migrations**
   ```bash
   # Compare schema.sql with migrations
   # Ensure all tables/indexes from migrations are in schema.sql
   ```

## Permission Errors

**Symptoms:**
- Can't read/write migration files
- Can't write to migrations table

**Solutions:**

1. **Check file permissions**
   ```bash
   chmod 644 migrations/*.sql
   ```

2. **Check database permissions**
   ```bash
   chmod 644 local.db
   ```

## Testing Migrations

To test a migration before committing:

1. **Backup database**
   ```bash
   cp local.db local.db.backup
   ```

2. **Create migration**
   ```bash
   # Write migration file
   ```

3. **Restart app**
   ```bash
   npm run dev
   ```

4. **Verify changes**
   ```bash
   # Check tables/indexes in SQLite browser
   # Verify app functionality
   ```

5. **Rollback if needed**
   ```bash
   rm local.db
   cp local.db.backup local.db
   # Fix migration and try again
   ```

## Getting Help

If you encounter issues not covered here:

1. Check migration runner logs in console
2. Review `src/lib/server/migrate.ts` for implementation details
3. Check SQLite documentation for SQL syntax
4. Verify schema.sql matches your expected database state
