import { command, form, getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';
const DEMO_PASSWORD = env.DEMO_PASSWORD || 'demo1234567890';
const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY;

async function verify_turnstile(
	token: string,
	ip: string,
): Promise<boolean> {
	const response = await fetch(
		'https://challenges.cloudflare.com/turnstile/v0/siteverify',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				secret: TURNSTILE_SECRET_KEY,
				response: token,
				remoteip: ip,
			}),
		},
	);

	const data = await response.json();
	return data.success === true;
}

export const register = form(
	v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
		email: v.pipe(v.string(), v.email('Invalid email address')),
		password: v.pipe(
			v.string(),
			v.minLength(8, 'Password must be at least 8 characters'),
		),
		turnstile_token: v.string(),
	}),
	async ({ name, email, password, turnstile_token }) => {
		const event = getRequestEvent();
		const ip =
			event.request.headers.get('x-forwarded-for')?.split(',')[0] ||
			event.request.headers.get('x-real-ip') ||
			'unknown';

		// Verify Turnstile token
		const is_valid = await verify_turnstile(turnstile_token, ip);
		if (!is_valid) {
			return {
				error: 'Failed to verify captcha. Please try again.',
			};
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password },
				headers: event.request.headers,
			});
		} catch (error: any) {
			console.error('Registration error:', error);
			return {
				error: error.message || 'Registration failed',
			};
		}

		// Redirect MUST be outside try/catch because it throws an error
		redirect(303, '/register/success');
	},
);

export const login = form(
	v.object({
		email: v.pipe(v.string(), v.email('Invalid email address')),
		password: v.pipe(
			v.string(),
			v.minLength(1, 'Password is required'),
		),
	}),
	async ({ email, password }) => {
		const event = getRequestEvent();

		try {
			// sveltekitCookies plugin handles cookies automatically
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers,
			});
		} catch (error: any) {
			// Check if error is due to unverified email
			if (
				error.message?.includes('verify') ||
				error.message?.includes('verification')
			) {
				return {
					error:
						'Please verify your email address before logging in.',
					unverified: true,
					email,
				};
			}
			return {
				error: error.message || 'Invalid email or password',
			};
		}

		redirect(303, '/dashboard');
	},
);

export const logout = command(async () => {
	const event = getRequestEvent();

	await auth.api.signOut({
		headers: event.request.headers,
	});

	return { success: true };
});

export const get_current_user = query(async () => {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	return session?.user ?? null;
});

export const demo_login = command(async () => {
	const event = getRequestEvent();

	try {
		await auth.api.signInEmail({
			body: {
				email: DEMO_USER_EMAIL,
				password: DEMO_PASSWORD,
			},
			headers: event.request.headers,
		});

		return { success: true };
	} catch (error: any) {
		console.error('Demo login error:', error);
		return {
			success: false,
			error: error.message || 'Demo login failed',
		};
	}
});

export const resend_verification_email = command(
	v.pipe(v.string(), v.email('Invalid email address')),
	async (email: string) => {
		const event = getRequestEvent();

		try {
			await auth.api.sendVerificationEmail({
				body: { email, callbackURL: '/dashboard' },
				headers: event.request.headers,
			});

			return {
				success: true,
				message: 'Verification email sent! Please check your inbox.',
			};
		} catch (error: any) {
			return {
				error: error.message || 'Failed to send verification email',
			};
		}
	},
);

export const forgot_password = form(
	v.object({
		email: v.pipe(v.string(), v.email('Invalid email address')),
		turnstile_token: v.string(),
	}),
	async ({ email, turnstile_token }) => {
		const event = getRequestEvent();
		const mode = event.url.searchParams.get('mode');
		const ip =
			event.request.headers.get('x-forwarded-for')?.split(',')[0] ||
			event.request.headers.get('x-real-ip') ||
			'unknown';

		// Verify Turnstile token
		const is_valid = await verify_turnstile(turnstile_token, ip);
		if (!is_valid) {
			return {
				error: 'Failed to verify captcha. Please try again.',
			};
		}

		try {
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo: '/reset-password',
				},
				headers: event.request.headers,
			});
		} catch (error: any) {
			console.error('Forgot password error:', error);
			// Don't reveal if email exists - still redirect to success page
		}

		// Always redirect to success page for security (don't reveal if email exists)
		// Preserve mode parameter if present
		const redirectUrl =
			mode === 'setup'
				? '/forgot-password/sent?mode=setup'
				: '/forgot-password/sent';
		redirect(303, redirectUrl);
	},
);

export const reset_password = form(
	v.object({
		password: v.pipe(
			v.string(),
			v.minLength(8, 'Password must be at least 8 characters'),
		),
		token: v.pipe(v.string(), v.minLength(1, 'Token is required')),
	}),
	async ({ password, token }) => {
		const event = getRequestEvent();

		try {
			await auth.api.resetPassword({
				body: { newPassword: password, token },
				headers: event.request.headers,
			});
		} catch (error: any) {
			console.error('Reset password error:', error);
			return {
				error:
					error.message ||
					'Failed to reset password. The link may have expired.',
			};
		}

		redirect(303, '/login?reset=success');
	},
);
