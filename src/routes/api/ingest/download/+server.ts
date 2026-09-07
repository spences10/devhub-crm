import { env } from '$env/dynamic/private';
import { get_database_path } from '$lib/server/db-path';
import { error, type RequestHandler } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';

// Download latest database backup from production
// This endpoint serves binary database files for the pull_database task
//
// Usage:
// curl -H "Authorization: Bearer your-secret-token" \
//      https://devhub.party/api/ingest/download \
//      -o latest-backup.db
//
// Or use with pull_database task:
// curl -X POST http://localhost:5173/api/ingest \
//      -H "Content-Type: application/json" \
//      -d '{"task": "pull_database", "token": "your-secret-token"}'

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authorization
		const auth_header = request.headers.get('authorization');
		const token = auth_header?.replace('Bearer ', '');

		if (!token || token !== env.INGEST_TOKEN) {
			throw error(401, 'Unauthorized');
		}

		const db_path = get_database_path();
		const backups_dir = path.join(path.dirname(db_path), 'backups');

		console.log(`[download] Database path: ${db_path}`);
		console.log(`[download] Backups directory: ${backups_dir}`);

		// Find the most recent backup file
		const files = await fs.readdir(backups_dir);
		const backup_files = files
			.filter(
				(file) => file.startsWith('local-') && file.endsWith('.db'),
			)
			.sort()
			.reverse(); // newest first

		if (backup_files.length === 0) {
			throw error(404, 'No backup files found');
		}

		const latest_backup = backup_files[0];
		const backup_path = path.join(backups_dir, latest_backup);

		console.log(`[download] Latest backup: ${latest_backup}`);
		console.log(`[download] Full backup path: ${backup_path}`);

		// Check if file exists
		try {
			await fs.access(backup_path);
		} catch {
			throw error(404, 'Backup file not found');
		}

		// Read and return the file
		const file_buffer = await fs.readFile(backup_path);
		const file_stats = await fs.stat(backup_path);

		console.log(
			`[download] Serving backup: ${latest_backup} (${Math.round(file_stats.size / 1024 / 1024)}MB)`,
		);

		return new Response(new Uint8Array(file_buffer), {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${latest_backup}"`,
				'Content-Length': file_stats.size.toString(),
			},
		});
	} catch (err) {
		console.error('Error serving backup download:', err);
		throw error(500, 'Internal server error');
	}
};
