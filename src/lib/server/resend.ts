import * as env from '$app/env/private';
import { Resend } from 'resend';

// Use a placeholder during build, actual key at runtime
export const resend = new Resend(
	env.RESEND_API_KEY || 're_placeholder',
);
