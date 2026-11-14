import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EmptyState from './empty-state.svelte';

describe('EmptyState', () => {
	it('should render message text', async () => {
		await render(EmptyState, {
			message: 'No contacts found',
		});

		await expect
			.element(page.getByText('No contacts found'))
			.toBeInTheDocument();
	});

	it('should render without action button when not provided', async () => {
		await render(EmptyState, {
			message: 'No items',
		});

		await expect
			.element(page.getByText('No items'))
			.toBeInTheDocument();

		// Should not render a button when action props are not provided
		const buttons = page.getByRole('link');
		await expect.element(buttons).not.toBeInTheDocument();
	});

	it('should render action link when provided', async () => {
		await render(EmptyState, {
			message: 'No contacts yet',
			action_href: '/contacts/new',
			action_text: 'Add Contact',
		});

		const link = page.getByRole('link', { name: 'Add Contact' });
		await expect.element(link).toBeInTheDocument();
		await expect
			.element(link)
			.toHaveAttribute('href', '/contacts/new');
	});

	it('should apply primary button styling to action link', async () => {
		await render(EmptyState, {
			message: 'Empty state',
			action_href: '/create',
			action_text: 'Create New',
		});

		const link = page.getByRole('link', { name: 'Create New' });
		await expect.element(link).toHaveClass(/btn-primary/);
	});
});
