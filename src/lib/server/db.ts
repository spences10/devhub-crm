import { DatabaseSync } from 'node:sqlite';
import * as sqliteVec from 'sqlite-vec';
import { get_database_path } from './db-path';

interface Statement {
	all(...values: unknown[]): unknown[];
	get(...values: unknown[]): unknown;
	run(...values: unknown[]): {
		changes: number;
		lastInsertRowid: number | bigint;
	};
}

interface Database {
	exec(sql: string): void;
	prepare(sql: string): Statement;
}

const native_db = new DatabaseSync(get_database_path(), {
	allowExtension: true,
});
const db = native_db as unknown as Database;

try {
	sqliteVec.load(native_db);
	console.log('sqlite-vec extension loaded successfully');
} catch (error) {
	console.warn('sqlite-vec extension failed to load:', error);
	console.warn('Vector similarity queries will not work');
}

native_db.exec('PRAGMA foreign_keys = ON');
native_db.exec('PRAGMA journal_mode = WAL');
native_db.exec('PRAGMA busy_timeout = 5000');
native_db.exec('PRAGMA synchronous = NORMAL');

export function run_in_transaction<T>(fn: () => T): T {
	native_db.exec('BEGIN');

	try {
		const result = fn();
		native_db.exec('COMMIT');
		return result;
	} catch (error) {
		if (native_db.isTransaction) {
			native_db.exec('ROLLBACK');
		}
		throw error;
	}
}

export { db, native_db };
