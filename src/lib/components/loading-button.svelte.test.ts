import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoadingButton from './loading-button.svelte';

describe('LoadingButton', () => {
	it('should render button with children text', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(LoadingButton, { loading: false, children });

		const button = page.getByRole('button', { name: 'Submit' });
		await expect.element(button).toBeInTheDocument();
	});

	it('should handle click events', async () => {
		const click_handler = vi.fn();
		const children = createRawSnippet(() => ({
			render: () => `<span>Click me</span>`,
		}));

		await render(LoadingButton, {
			loading: false,
			onclick: click_handler,
			children,
		});

		const button = page.getByRole('button', { name: 'Click me' });
		await button.click();

		expect(click_handler).toHaveBeenCalledOnce();
	});

	it('should show loading state with spinner', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(LoadingButton, { loading: true, children });

		// Loading text should be visible
		await expect
			.element(page.getByText('Loading...'))
			.toBeInTheDocument();

		// Button should be disabled while loading
		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('should use custom loading text when provided', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Save</span>`,
		}));

		await render(LoadingButton, {
			loading: true,
			loading_text: 'Saving...',
			children,
		});

		await expect
			.element(page.getByText('Saving...'))
			.toBeInTheDocument();
	});

	it('should be disabled when loading', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(LoadingButton, { loading: true, children });

		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('should be disabled when disabled prop is true', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(LoadingButton, {
			loading: false,
			disabled: true,
			children,
		});

		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('should apply custom class names', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Custom</span>`,
		}));

		await render(LoadingButton, {
			loading: false,
			class_names: 'btn btn-primary',
			children,
		});

		const button = page.getByRole('button', { name: 'Custom' });
		await expect.element(button).toHaveClass(/btn-primary/);
	});

	it('should support submit type', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit Form</span>`,
		}));

		await render(LoadingButton, {
			loading: false,
			type: 'submit',
			children,
		});

		const button = page.getByRole('button', { name: 'Submit Form' });
		await expect.element(button).toHaveAttribute('type', 'submit');
	});

	it('should update when props change', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Update</span>`,
		}));

		const { rerender } = await render(LoadingButton, {
			loading: false,
			children,
		});

		// Initially enabled
		const button = page.getByRole('button');
		await expect.element(button).toBeEnabled();

		// Update to loading
		await rerender({ loading: true, children });

		// Now disabled and showing loading state
		await expect.element(button).toBeDisabled();
		await expect
			.element(page.getByText('Loading...'))
			.toBeInTheDocument();
	});
});
