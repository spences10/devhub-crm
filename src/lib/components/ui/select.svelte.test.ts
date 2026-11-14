import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Select from './select.svelte';

describe('Select', () => {
	it('should render select element', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<option value="1">Test</option>`,
		}));

		await render(Select, { children });

		const select = page.getByRole('combobox');
		await expect.element(select).toBeInTheDocument();
	});

	it('should display selected value', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<option value="email">Email</option>`,
		}));

		await render(Select, {
			value: 'email',
			children,
		});

		const select = page.getByRole('combobox');
		await expect.element(select).toHaveValue('email');
	});

	it('should handle user selection', async () => {
		const on_change = vi.fn();
		const children = createRawSnippet(() => ({
			render: () => `<option value="dark">Dark</option>`,
		}));

		await render(Select, {
			onchange: on_change,
			children,
		});

		const select = page.getByRole('combobox');
		await select.selectOptions('dark');

		expect(on_change).toHaveBeenCalled();
	});

	it('should be required when required prop is true', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<option value="1">John Doe</option>`,
		}));

		await render(Select, {
			required: true,
			children,
		});

		const select = page.getByRole('combobox');
		await expect.element(select).toHaveAttribute('required');
	});

	it('should be disabled when disabled prop is true', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<option>Loading...</option>
			`,
		}));

		await render(Select, {
			disabled: true,
			children,
		});

		const select = page.getByRole('combobox');
		await expect.element(select).toBeDisabled();
	});

	it('should have name attribute', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<option value="1">Option 1</option>
			`,
		}));

		await render(Select, {
			name: 'contact_id',
			children,
		});

		const select = page.getByRole('combobox');
		await expect
			.element(select)
			.toHaveAttribute('name', 'contact_id');
	});

	it('should have select base class and w-full', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<option>Test</option>`,
		}));

		const { container } = await render(Select, { children });

		const select = container.querySelector('select');
		expect(select?.classList.contains('select')).toBe(true);
		expect(select?.classList.contains('w-full')).toBe(true);
	});

	it('should apply custom class', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<option>Test</option>`,
		}));

		const { container } = await render(Select, {
			class_name: 'max-w-xs capitalize',
			children,
		});

		const select = container.querySelector('select');
		expect(select?.classList.contains('max-w-xs')).toBe(true);
		expect(select?.classList.contains('capitalize')).toBe(true);
	});
});
