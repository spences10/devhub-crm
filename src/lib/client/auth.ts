import { browser, dev } from '$app/env';
import { createAuthClient } from 'better-auth/svelte';

export const auth_client = createAuthClient({
	baseURL: dev
		? 'http://localhost:5173'
		: browser
			? window.location.origin
			: 'http://localhost:5173',
});
