import * as env from '$app/env/private';
import { db } from '#lib/server/db.ts';
import { run_migrations } from '#lib/server/migrate.ts';
import { themes } from '#lib/themes/index.ts';
import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { readFileSync } from 'node:fs';
import { seed_demo } from './routes/api/ingest/seed-demo';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';

// Initialize schema on startup (gracefully handle errors for columns that don't exist yet)
const schema = readFileSync('schema.sql', 'utf-8');
try {
	db.exec(schema);
} catch (error: any) {
	// Handle errors for indexes on columns that don't exist yet (will be added by migrations)
	if (error.message?.includes('no such column')) {
		console.log(
			'⚠️  Schema initialization skipped some indexes (columns will be added by migrations)',
		);
	} else {
		throw error;
	}
}

// Run any pending migrations
run_migrations();

// Re-apply schema to create any indexes that were skipped
try {
	db.exec(schema);
} catch (error: any) {
	// Silently ignore errors on second pass
	if (
		!error.message?.includes('no such column') &&
		error.code !== 'SQLITE_ERROR'
	) {
		console.error('Error re-applying schema:', error);
	}
}

// Auto-seed demo account on startup if it doesn't exist
const demo_user = db
	.prepare('SELECT id FROM user WHERE email = ?')
	.get(DEMO_USER_EMAIL);

if (!demo_user) {
	console.log('Demo user not found - seeding demo data...');
	seed_demo()
		.then((result) => {
			console.log('Demo seeded:', result.message);
		})
		.catch((error) => {
			console.error('Failed to seed demo:', error);
		});
}

const sync_on_startup: Handle = async ({ event, resolve }) => {
	// SQLite migration: No sync needed for local database
	return await resolve(event);
};

export const theme: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme');

	return await resolve(event, {
		transformPageChunk: ({ html }) => {
			if (theme && themes.includes(theme)) {
				return html.replace('data-theme=""', `data-theme="${theme}"`);
			}
			return html;
		},
	});
};

export const handle = sequence(sync_on_startup, theme);
