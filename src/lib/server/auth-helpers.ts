import { command, form, getRequestEvent, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import type { ObjectSchema } from 'valibot';
import { auth } from './auth';

/**
 * Get the current user's ID, or redirect to login if not authenticated
 */
export async function get_current_user_id(): Promise<string> {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (!session?.user?.id) {
		redirect(302, '/login');
	}

	return session.user.id;
}

/**
 * Wrap a query function to require authentication
 */
export const guarded_query = <T>(fn: () => T) => {
	return query(async () => {
		const event = getRequestEvent();

		const session = await auth.api.getSession({
			headers: event.request.headers,
		});

		if (!session) {
			redirect(302, '/login');
		}

		return fn();
	});
};

/**
 * Wrap a form function to require authentication
 */
export const guarded_form = <T extends ObjectSchema<any, any>>(
	schema: T,
	fn: (data: any) => any,
) => {
	return form(schema as any, async (data) => {
		const event = getRequestEvent();

		const session = await auth.api.getSession({
			headers: event.request.headers,
		});

		if (!session) {
			redirect(302, '/login');
		}

		return fn(data);
	});
};

/**
 * Wrap a command function to require authentication
 */
export const guarded_command = <T>(
	schema: any,
	fn: (data: T) => any,
) => {
	return command(schema, async (data: T) => {
		const event = getRequestEvent();

		const session = await auth.api.getSession({
			headers: event.request.headers,
		});

		if (!session) {
			redirect(302, '/login');
		}

		return fn(data);
	});
};
