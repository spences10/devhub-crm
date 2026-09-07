import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
				},
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
});

export default {
	...config,
	fmt: {
		useTabs: true,
		singleQuote: true,
		printWidth: 70,
		trailingComma: 'all',
		proseWrap: 'always',
		svelte: true,
		sortTailwindcss: { stylesheet: './src/app.css' },
		ignorePatterns: [
			'.svelte-kit/**',
			'build/**',
			'coverage/**',
			'playwright-report/**',
			'test-results/**',
			'package-lock.json',
			'pnpm-lock.yaml',
			'yarn.lock',
			'.claude/**',
		],
	},
	lint: {
		ignorePatterns: [
			'**/node_modules/**',
			'**/.svelte-kit/**',
			'**/build/**',
			'**/coverage/**',
			'**/playwright-report/**',
			'**/test-results/**',
			'**/.claude/**',
		],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
};
