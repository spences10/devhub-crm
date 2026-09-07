import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import { backup_database } from './backup-database';
import { compute_insights } from './compute-insights';
import { pull_database } from './pull-database';
import { seed_demo } from './seed-demo';
import { update_embeddings } from './update-embeddings';

/**
 * === BACKUP DATABASE ===
 *
 * Trigger a database backup:
 *
 curl -X POST https://devhub.party/api/ingest \
   -H "Content-Type: application/json" \
   -d '{"task": "backup_database", "token": "your-secret-token"}'
 *
 * === PULL DATABASE ===
 *
 * Pull production database to local:
 *
 curl -X POST http://localhost:5173/api/ingest \
   -H "Content-Type: application/json" \
   -d '{"task": "pull_database", "token": "your-secret-token"}'
 *
 * === SEED DEMO ===
 *
 * Reset demo account with seed data:
 *
 curl -X POST https://devhub.party/api/ingest \
   -H "Content-Type: application/json" \
   -d '{"task": "seed_demo", "token": "your-secret-token"}'
 *
 * === UPDATE EMBEDDINGS ===
 *
 * Generate embeddings for contacts and interactions:
 *
 curl -X POST https://devhub.party/api/ingest \
   -H "Content-Type: application/json" \
   -d '{"task": "update_embeddings", "token": "your-secret-token"}'
 *
 * === COMPUTE INSIGHTS ===
 *
 * Compute AI-powered dashboard insights:
 *
 curl -X POST https://devhub.party/api/ingest \
   -H "Content-Type: application/json" \
   -d '{"task": "compute_insights", "token": "your-secret-token"}'
 */

type TaskFunction<TArgs = any, TResult = any> = (
	...args: TArgs[]
) => Promise<TResult>;

type TaskKey =
	| 'backup_database'
	| 'pull_database'
	| 'seed_demo'
	| 'update_embeddings'
	| 'compute_insights';

interface TaskType {
	[key: string]: {
		function: TaskFunction;
	};
}

interface RequestBody {
	token: string;
	task: TaskKey;
}

const tasks: TaskType = {
	backup_database: {
		function: backup_database,
	},
	pull_database: {
		function: pull_database,
	},
	seed_demo: {
		function: seed_demo,
	},
	update_embeddings: {
		function: update_embeddings,
	},
	compute_insights: {
		function: compute_insights,
	},
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: RequestBody = await request.json();
		const token = body.token;
		const task_key = body.task;

		if (!token || token !== env.INGEST_TOKEN) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}

		const task = tasks[task_key];
		if (task && typeof task.function === 'function') {
			console.log(`Executing task: ${task_key}`);

			try {
				const result = await task.function();
				console.log(
					`Task ${task_key} completed with result:`,
					result,
				);
				return json(result);
			} catch (task_error) {
				console.error(
					`Error executing task ${task_key}:`,
					task_error,
				);
				return json(
					{
						message: `Error executing task ${task_key}`,
						error:
							task_error instanceof Error
								? task_error.message
								: 'Unknown error',
					},
					{ status: 500 },
				);
			}
		} else {
			return json(
				{
					message:
						'Specified task does not exist or is not a function',
				},
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error('Error in POST /api/ingest:', error);
		const error_message =
			error instanceof Error ? error.message : 'Unknown error';
		const error_stack = error instanceof Error ? error.stack : '';
		return json(
			{
				message: 'Error processing the request',
				error: error_message,
				stack: error_stack,
			},
			{ status: 500 },
		);
	}
};
