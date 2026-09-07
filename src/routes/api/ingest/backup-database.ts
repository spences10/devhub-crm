import { get_database_path } from '$lib/server/db-path';
import { format } from 'date-fns';
import fs from 'node:fs/promises';
import { backup, DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export const backup_database = async () => {
	try {
		const db_path = get_database_path();
		const backups_dir = path.join(path.dirname(db_path), 'backups');

		console.log(`[backup_database] Database path: ${db_path}`);
		console.log(
			`[backup_database] Backups directory: ${backups_dir}`,
		);
		console.log(
			`[backup_database] Current working directory: ${process.cwd()}`,
		);

		// Ensure backups directory exists
		await fs.mkdir(backups_dir, { recursive: true });
		console.log(
			`[backup_database] Backups directory created/verified`,
		);

		// Create timestamped backup filename with hour for multiple backups per day
		const now = new Date();
		const date = format(now, 'yyyy-MM-dd');
		const hour = format(now, 'HH');
		const backup_filename = `local-${date}-${hour}00.db`;
		const backup_path = path.join(backups_dir, backup_filename);

		// Use SQLite's native backup API to avoid corruption with WAL mode
		// Opens a separate connection for backup to ensure consistency
		// See: scottspence.com/posts/sqlite-corruption-fs-copyfile-issue
		console.log(
			`[backup_database] Creating backup: ${backup_filename}`,
		);
		console.log(`[backup_database] Full backup path: ${backup_path}`);

		const source_db = new DatabaseSync(db_path, { readOnly: true });

		try {
			await backup(source_db, backup_path);
			console.log(`[backup_database] Backup created successfully`);
		} finally {
			source_db.close();
		}

		// Clean up old backups (keep 28 backups = 7 days × 4 backups/day)
		const files = await fs.readdir(backups_dir);
		const backup_files = files
			.filter(
				(file) => file.startsWith('local-') && file.endsWith('.db'),
			)
			.sort()
			.reverse(); // newest first

		console.log(
			`[backup_database] Found ${backup_files.length} existing backups`,
		);

		// Remove files beyond the 28 most recent
		const files_to_delete = backup_files.slice(28);
		if (files_to_delete.length > 0) {
			console.log(
				`[backup_database] Deleting ${files_to_delete.length} old backups`,
			);
		}
		for (const file of files_to_delete) {
			await fs.unlink(path.join(backups_dir, file));
		}

		const backup_size = await fs.stat(backup_path);
		console.log(
			`[backup_database] Backup size: ${Math.round(backup_size.size / 1024 / 1024)}MB`,
		);

		return {
			message: 'Database exported successfully',
			backup_file: backup_filename,
			backup_size: `${Math.round(backup_size.size / 1024 / 1024)}MB`,
			backups_kept: Math.min(backup_files.length, 28),
			files_deleted: files_to_delete.length,
		};
	} catch (error) {
		console.error('Error exporting database:', error);
		throw error;
	}
};
