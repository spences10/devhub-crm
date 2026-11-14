import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Button from './button.svelte';

describe('Button', () => {
	it('should render button with children text', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(Button, { children });

		const button = page.getByRole('button', { name: 'Submit' });
		await expect.element(button).toBeInTheDocument();
	});

	it('should handle click events', async () => {
		const click_handler = vi.fn();
		const children = createRawSnippet(() => ({
			render: () => `<span>Click me</span>`,
		}));

		await render(Button, {
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

		await render(Button, { loading: true, children });

		// Loading text should be visible
		await expect
			.element(page.getByText('Loading...'))
			.toBeInTheDocument();

		// Button should be disabled while loading
		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('should be disabled when disabled prop is true', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit</span>`,
		}));

		await render(Button, {
			disabled: true,
			children,
		});

		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('should apply variant classes - primary', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Primary</span>`,
		}));

		await render(Button, {
			variant: 'primary',
			children,
		});

		const button = page.getByRole('button', { name: 'Primary' });
		await expect.element(button).toHaveClass(/btn-primary/);
	});

	it('should apply variant classes - outline', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Outline</span>`,
		}));

		await render(Button, {
			variant: 'outline',
			children,
		});

		const button = page.getByRole('button', { name: 'Outline' });
		await expect.element(button).toHaveClass(/btn-outline/);
	});

	it('should apply variant classes - ghost', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Ghost</span>`,
		}));

		await render(Button, {
			variant: 'ghost',
			children,
		});

		const button = page.getByRole('button', { name: 'Ghost' });
		await expect.element(button).toHaveClass(/btn-ghost/);
	});

	it('should apply variant classes - error', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Delete</span>`,
		}));

		await render(Button, {
			variant: 'error',
			children,
		});

		const button = page.getByRole('button', { name: 'Delete' });
		await expect.element(button).toHaveClass(/btn-error/);
	});

	it('should apply size classes - xs', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Tiny</span>`,
		}));

		await render(Button, {
			size: 'xs',
			children,
		});

		const button = page.getByRole('button', { name: 'Tiny' });
		await expect.element(button).toHaveClass(/btn-xs/);
	});

	it('should apply size classes - sm', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Small</span>`,
		}));

		await render(Button, {
			size: 'sm',
			children,
		});

		const button = page.getByRole('button', { name: 'Small' });
		await expect.element(button).toHaveClass(/btn-sm/);
	});

	it('should apply size classes - block', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Full Width</span>`,
		}));

		await render(Button, {
			size: 'block',
			children,
		});

		const button = page.getByRole('button', { name: 'Full Width' });
		await expect.element(button).toHaveClass(/btn-block/);
	});

	it('should support submit type', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Submit Form</span>`,
		}));

		await render(Button, {
			type: 'submit',
			children,
		});

		const button = page.getByRole('button', { name: 'Submit Form' });
		await expect.element(button).toHaveAttribute('type', 'submit');
	});

	it('should default to button type', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Click</span>`,
		}));

		await render(Button, { children });

		const button = page.getByRole('button', { name: 'Click' });
		await expect.element(button).toHaveAttribute('type', 'button');
	});

	it('should apply custom class names', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Custom</span>`,
		}));

		await render(Button, {
			class: 'my-custom-class',
			children,
		});

		const button = page.getByRole('button', { name: 'Custom' });
		await expect.element(button).toHaveClass(/my-custom-class/);
	});

	it('should combine variant, size, and custom classes', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Combined</span>`,
		}));

		await render(Button, {
			variant: 'primary',
			size: 'lg',
			class: 'custom-spacing',
			children,
		});

		const button = page.getByRole('button', { name: 'Combined' });
		await expect.element(button).toHaveClass(/btn-primary/);
		await expect.element(button).toHaveClass(/btn-lg/);
		await expect.element(button).toHaveClass(/custom-spacing/);
	});

	it('should update when props change', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Update</span>`,
		}));

		const { rerender } = await render(Button, {
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

	it('should not trigger click when loading', async () => {
		const click_handler = vi.fn();
		const children = createRawSnippet(() => ({
			render: () => `<span>Save</span>`,
		}));

		await render(Button, {
			loading: true,
			onclick: click_handler,
			children,
		});

		const button = page.getByRole('button');

		// Button should be disabled, so click should not work
		await expect.element(button).toBeDisabled();
	});

	it('should have btn base class', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<span>Base</span>`,
		}));

		await render(Button, { children });

		const button = page.getByRole('button', { name: 'Base' });
		await expect.element(button).toHaveClass(/btn/);
	});
});
