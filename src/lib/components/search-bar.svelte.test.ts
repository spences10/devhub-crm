import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SearchBar from './search-bar.svelte';

describe('SearchBar', () => {
	it('should render search input with placeholder', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: '',
			placeholder: 'Search contacts...',
			on_change,
		});

		const input = page.getByPlaceholder('Search contacts...');
		await expect.element(input).toBeInTheDocument();
	});

	it('should display initial value', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: 'John Doe',
			placeholder: 'Search...',
			on_change,
		});

		const input = page.getByRole('textbox');
		await expect.element(input).toHaveValue('John Doe');
	});

	it('should call on_change when user types', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: '',
			placeholder: 'Search...',
			on_change,
		});

		const input = page.getByRole('textbox');
		await input.fill('test query');

		// on_change should be called multiple times as user types
		expect(on_change).toHaveBeenCalled();
		expect(on_change).toHaveBeenCalledWith('test query');
	});

	it('should have accessible fieldset structure', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: '',
			placeholder: 'Search...',
			on_change,
		});

		// Check for legend text which indicates proper fieldset structure
		await expect
			.element(page.getByText('Search'))
			.toBeInTheDocument();

		// Verify the input is accessible
		const input = page.getByRole('textbox');
		await expect.element(input).toBeInTheDocument();
	});

	it('should update value when rerendered', async () => {
		const on_change = vi.fn();

		const { rerender } = await render(SearchBar, {
			value: '',
			placeholder: 'Search...',
			on_change,
		});

		const input = page.getByRole('textbox');

		// Initially empty
		await expect.element(input).toHaveValue('');

		// Update value
		await rerender({
			value: 'updated search',
			placeholder: 'Search...',
			on_change,
		});

		// Check updated value
		await expect.element(input).toHaveValue('updated search');
	});

	it('should handle rapid input changes', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: '',
			placeholder: 'Search...',
			on_change,
		});

		const input = page.getByRole('textbox');

		// Simulate rapid typing
		await input.fill('a');
		await input.fill('ab');
		await input.fill('abc');

		// Verify on_change was called for each change
		expect(on_change.mock.calls.length).toBeGreaterThan(0);

		// Get the last call to verify final value
		const lastCall =
			on_change.mock.calls[on_change.mock.calls.length - 1];
		expect(lastCall[0]).toBe('abc');
	});

	it('should clear search when value is empty', async () => {
		const on_change = vi.fn();

		await render(SearchBar, {
			value: 'initial search',
			placeholder: 'Search...',
			on_change,
		});

		const input = page.getByRole('textbox');

		// Clear the input
		await input.fill('');

		// Verify on_change was called with empty string
		expect(on_change).toHaveBeenCalledWith('');
	});
});
