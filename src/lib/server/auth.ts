import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import Database from 'better-sqlite3';
import { get_database_path } from './db-path';
import { resend } from './resend';

// Create separate database instance for Better Auth
const auth_db = new Database(get_database_path());

// Enable WAL mode for better concurrency
auth_db.pragma('journal_mode = WAL');
auth_db.pragma('busy_timeout = 5000');
auth_db.pragma('synchronous = NORMAL');

export const auth = betterAuth({
	database: auth_db,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({
			user,
			url,
		}: {
			user: any;
			url: string;
		}) => {
			try {
				console.log('Sending password reset email to:', user.email);

				const result = await resend.emails.send({
					from: 'Devhub <updates@updates.devhub.party>',
					to: user.email,
					subject: 'Reset your password',
					html: `
						<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
							<h2>Reset your password</h2>
							<p>Hi ${user.name},</p>
							<p>We received a request to reset your password. Click the link below to create a new password:</p>
							<p>
								<a href="${url}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
									Reset Password
								</a>
							</p>
							<p>Or copy and paste this link into your browser:</p>
							<p style="color: #666; font-size: 14px;">${url}</p>
							<p>This link will expire in 1 hour.</p>
							<p>If you didn't request a password reset, you can safely ignore this email.</p>
						</div>
					`,
				});

				console.log(
					'Password reset email sent successfully:',
					result,
				);
			} catch (error) {
				console.error('Failed to send password reset email:', error);
				throw error;
			}
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({
			user,
			url,
		}: {
			user: any;
			url: string;
		}) => {
			try {
				console.log('Sending verification email to:', user.email);
				console.log('Resend API Key exists:', !!env.RESEND_API_KEY);

				const result = await resend.emails.send({
					from: 'Devhub <updates@updates.devhub.party>',
					to: user.email,
					subject: 'Verify your email address',
					html: `
						<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
							<h2>Welcome to Devhub!</h2>
							<p>Hi ${user.name},</p>
							<p>Thanks for signing up. Please verify your email address to get started.</p>
							<p>
								<a href="${url}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
									Verify Email Address
								</a>
							</p>
							<p>Or copy and paste this link into your browser:</p>
							<p style="color: #666; font-size: 14px;">${url}</p>
							<p>This link will expire in 24 hours.</p>
							<p>If you didn't create an account, you can safely ignore this email.</p>
						</div>
					`,
				});

				console.log('Email sent successfully:', result);

				// Send notification to admin
				try {
					await resend.emails.send({
						from: 'Devhub <updates@updates.devhub.party>',
						to: 'updates@devhub.party',
						subject: '🎉 New Devhub signup!',
						html: `
							<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
								<h2>🎉 New user signed up!</h2>
								<p><strong>Name:</strong> ${user.name}</p>
								<p><strong>Email:</strong> ${user.email}</p>
								<p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
								<p><strong>User ID:</strong> ${user.id}</p>
							</div>
						`,
					});
					console.log(
						'Admin notification sent for new user:',
						user.email,
					);
				} catch (notifyError) {
					// Don't block signup if notification fails
					console.error(
						'Failed to send admin notification:',
						notifyError,
					);
				}
			} catch (error) {
				console.error('Failed to send verification email:', error);
				throw error;
			}
		},
	},
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID as string,
			clientSecret: env.GITHUB_CLIENT_SECRET as string,
			scope: ['user:email'],
		},
	},
	secret: env.AUTH_SECRET || 'dev-secret-change-in-production-ok',
	baseURL: env.AUTH_BASE_URL || 'http://localhost:5173',
	plugins: [
		sveltekitCookies(getRequestEvent), // Automatically handles cookies
	],
});
