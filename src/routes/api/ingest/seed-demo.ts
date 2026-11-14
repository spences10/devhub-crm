import * as env from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db.ts';
import fs from 'node:fs';
import path from 'node:path';

const DEMO_USER_EMAIL = env.DEMO_USER_EMAIL || 'demo@devhub.party';
const DEMO_USER_NAME = env.DEMO_USER_NAME || 'Demo User';
const DEMO_PASSWORD = env.DEMO_PASSWORD || 'demo1234567890';

export const seed_demo = async () => {
	try {
		// Check if demo user exists
		let demo_user = db
			.prepare('SELECT id FROM user WHERE email = ?')
			.get(DEMO_USER_EMAIL) as { id: string } | undefined;

		// Create demo user and profile if doesn't exist using better-auth's signup
		if (!demo_user) {
			try {
				await auth.api.signUpEmail({
					body: {
						email: DEMO_USER_EMAIL,
						password: DEMO_PASSWORD,
						name: DEMO_USER_NAME,
					},
				});

				// Get the newly created user
				demo_user = db
					.prepare('SELECT id FROM user WHERE email = ?')
					.get(DEMO_USER_EMAIL) as { id: string };

				// Mark email as verified
				db.prepare(
					'UPDATE user SET emailVerified = 1 WHERE email = ?',
				).run(DEMO_USER_EMAIL);

				// Create user profile for the demo user
				const profile_id = crypto.randomUUID();
				const now = Date.now();
				db.prepare(
					`
					INSERT INTO user_profiles (
						id, user_id, username, github_username,
						bio, tagline, location, website, visibility,
						created_at, updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`,
				).run(
					profile_id,
					demo_user!.id,
					'dev-hubber',
					null,
					'This is a demo account with sample data. Sign up to create your own CRM!',
					'Try DevHub CRM',
					null,
					null,
					'public',
					now,
					now,
				);
			} catch (error) {
				console.error('Error creating demo user:', error);
				throw error;
			}
		} else {
			// Demo user exists - ensure profile exists
			const existing_profile = db
				.prepare('SELECT id FROM user_profiles WHERE user_id = ?')
				.get(demo_user.id);

			if (!existing_profile) {
				const profile_id = crypto.randomUUID();
				const now = Date.now();
				db.prepare(
					`
					INSERT INTO user_profiles (
						id, user_id, username, github_username,
						bio, tagline, location, website, visibility,
						created_at, updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`,
				).run(
					profile_id,
					demo_user.id,
					'dev-hubber',
					null,
					'This is a demo account with sample data. Sign up to create your own CRM!',
					'Try DevHub CRM',
					null,
					null,
					'public',
					now,
					now,
				);
			}
		}

		// Clear existing demo data (in correct order due to foreign key constraints)
		db.prepare(
			'DELETE FROM contact_tags WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = ?)',
		).run(demo_user.id);
		db.prepare(
			'DELETE FROM social_links WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = ?)',
		).run(demo_user.id);
		db.prepare(
			'DELETE FROM follow_ups WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = ?)',
		).run(demo_user.id);
		db.prepare(
			'DELETE FROM interactions WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = ?)',
		).run(demo_user.id);
		db.prepare('DELETE FROM tags WHERE user_id = ?').run(
			demo_user.id,
		);
		db.prepare('DELETE FROM contacts WHERE user_id = ?').run(
			demo_user.id,
		);

		// Read and execute seed.sql, but replace the user_id selector
		const seed_path = path.join(process.cwd(), 'seed.sql');
		const seed_sql = fs.readFileSync(seed_path, 'utf-8');

		// Replace (SELECT id FROM user LIMIT 1) with the actual demo user ID
		const modified_sql = seed_sql.replace(
			/\(SELECT id FROM user LIMIT 1\)/g,
			`'${demo_user.id}'`,
		);

		// Execute the SQL
		db.exec(modified_sql);

		return {
			message: 'Demo account seeded successfully',
			demo_email: DEMO_USER_EMAIL,
			user_id: demo_user.id,
		};
	} catch (error) {
		console.error('Error seeding demo account:', error);
		throw error;
	}
};
