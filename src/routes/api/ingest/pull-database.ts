import { env } from '$env/dynamic/private';
import { get_database_path } from '$lib/server/db-path';
import { format } from 'date-fns';
import fs from 'node:fs/promises';
import { backup, DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export const pull_database = async () => {
	try {
		const db_path = get_database_path();
		const backups_dir = path.join(path.dirname(db_path), 'backups');

		// Ensure backups directory exists
		await fs.mkdir(backups_dir, { recursive: true });

		const production_url =
			env.PRODUCTION_URL || 'https://devhub.party';

		console.log(`[pull_database] Database path: ${db_path}`);
		console.log(`[pull_database] Backups directory: ${backups_dir}`);
		console.log(`[pull_database] Production URL: ${production_url}`);

		// Download latest backup from production
		console.log('Downloading latest backup from production...');
		const response = await fetch(
			`${production_url}/api/ingest/download`,
			{
				headers: {
					Authorization: `Bearer ${env.INGEST_TOKEN}`,
				},
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to download backup: ${response.status} ${response.statusText}`,
			);
		}

		// Save downloaded backup to temporary location
		const now = new Date();
		const date = format(now, 'yyyy-MM-dd');
		const time = format(now, 'HHmm');
		const downloaded_filename = `local-downloaded-${date}-${time}.db`;
		const downloaded_path = path.join(
			backups_dir,
			downloaded_filename,
		);

		const arrayBuffer = await response.arrayBuffer();
		await fs.writeFile(downloaded_path, new Uint8Array(arrayBuffer));

		console.log(
			`[pull_database] Downloaded backup saved to: ${downloaded_path}`,
		);

		// Create backup of current local database before replacing using SQLite backup API
		const current_backup_name = `local-backup-${date}-${time}.db`;
		const current_backup_path = path.join(
			backups_dir,
			current_backup_name,
		);

		try {
			const current_db = new DatabaseSync(db_path, { readOnly: true });
			try {
				await backup(current_db, current_backup_path);
				console.log(
					`[pull_database] Current database backed up to: ${current_backup_path}`,
				);
			} finally {
				current_db.close();
			}
		} catch (error) {
			console.warn(
				'Could not backup current database (may not exist):',
				error,
			);
		}

		// Replace local database with downloaded backup using SQLite backup API
		// This avoids corruption issues with WAL mode (see: scottspence.com/posts/sqlite-corruption-fs-copyfile-issue)
		const downloaded_db = new DatabaseSync(downloaded_path, {
			readOnly: true,
		});

		try {
			await backup(downloaded_db, db_path);
			console.log(
				`[pull_database] Database replaced with production backup`,
			);
		} finally {
			downloaded_db.close();
		}

		const imported_size = await fs.stat(db_path);

		// Clean up old downloaded backups (keep 10 most recent)
		const all_files = await fs.readdir(backups_dir);
		const downloaded_files = all_files
			.filter(
				(file) =>
					file.startsWith('local-downloaded-') &&
					file.endsWith('.db'),
			)
			.sort()
			.reverse(); // newest first

		const downloaded_to_delete = downloaded_files.slice(10);
		for (const file of downloaded_to_delete) {
			await fs.unlink(path.join(backups_dir, file));
		}

		// Clean up old local backups (keep 10 most recent)
		const backup_files = all_files
			.filter(
				(file) =>
					file.startsWith('local-backup-') && file.endsWith('.db'),
			)
			.sort()
			.reverse(); // newest first

		const backups_to_delete = backup_files.slice(10);
		for (const file of backups_to_delete) {
			await fs.unlink(path.join(backups_dir, file));
		}

		return {
			message: 'Database pulled from production successfully',
			downloaded_backup: downloaded_filename,
			database_size: `${Math.round(imported_size.size / 1024 / 1024)}MB`,
			local_backup_created: current_backup_name,
			downloaded_files_deleted: downloaded_to_delete.length,
			backup_files_deleted: backups_to_delete.length,
		};
	} catch (error) {
		console.error('Error pulling database:', error);
		throw error;
	}
};
