import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	AUTH_SECRET: { schema: v.optional(v.string()) },
	VOYAGE_API_KEY: { schema: v.optional(v.string()) },
	DEMO_PASSWORD: { schema: v.optional(v.string()) },
	AUTH_BASE_URL: { schema: v.optional(v.string()) },
	DATABASE_PATH: { schema: v.optional(v.string()) },
	DEMO_USER_EMAIL: { schema: v.optional(v.string()) },
	DEMO_USER_NAME: { schema: v.optional(v.string()) },
	GITHUB_CLIENT_ID: { schema: v.optional(v.string()) },
	GITHUB_CLIENT_SECRET: { schema: v.optional(v.string()) },
	INGEST_TOKEN: { schema: v.optional(v.string()) },
	PRODUCTION_URL: { schema: v.optional(v.string()) },
	RESEND_API_KEY: { schema: v.optional(v.string()) },
	TURNSTILE_SECRET_KEY: { schema: v.optional(v.string()) },
	PUBLIC_TURNSTILE_SITE_KEY: { public: true, static: true },
	PUBLIC_FATHOM_ID: { public: true, static: true },
	PUBLIC_FATHOM_URL: { public: true, static: true },
});
