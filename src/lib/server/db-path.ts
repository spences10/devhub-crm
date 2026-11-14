import * as env from '$app/env/private';
import path from 'node:path';

/**
 * Get the database path based on environment
 *
 * Production (Coolify): Uses DATABASE_PATH env var -> /app/data/local.db
 * Local dev: Uses data/local.db
 */
export const get_database_path = () => {
	const db_path =
		env.DATABASE_PATH || path.join(process.cwd(), 'data', 'local.db');
	console.log(`[db-path] Resolved database path: ${db_path}`);
	console.log(
		`[db-path] DATABASE_PATH env var: ${env.DATABASE_PATH || 'not set'}`,
	);
	return db_path;
};
