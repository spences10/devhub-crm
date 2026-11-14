import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Radio from './radio.svelte';

describe('Radio', () => {
	it('should render radio button without label', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).toBeInTheDocument();
	});

	it('should render radio button with label', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
			label: '24-hour',
		});

		const radio = page.getByRole('radio', { name: '24-hour' });
		await expect.element(radio).toBeInTheDocument();
	});

	it('should be unchecked by default', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).not.toBeChecked();
	});

	it('should be checked when checked prop is true', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
			checked: true,
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).toBeChecked();
	});

	it('should have required name attribute', async () => {
		await render(Radio, {
			name: 'time_format',
			value: '12h',
		});

		const radio = page.getByRole('radio');
		await expect
			.element(radio)
			.toHaveAttribute('name', 'time_format');
	});

	it('should have value attribute', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).toHaveAttribute('value', '24h');
	});

	it('should call onchange when selected', async () => {
		const on_change = vi.fn();

		await render(Radio, {
			name: 'format',
			value: '24h',
			onchange: on_change,
		});

		const radio = page.getByRole('radio');
		await radio.click();

		expect(on_change).toHaveBeenCalled();
	});

	it('should be disabled when disabled prop is true', async () => {
		await render(Radio, {
			name: 'format',
			value: '24h',
			disabled: true,
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).toBeDisabled();
	});

	it('should have radio and radio-primary classes', async () => {
		const { container } = await render(Radio, {
			name: 'format',
			value: '24h',
		});

		const radio = container.querySelector('input[type="radio"]');
		expect(radio?.classList.contains('radio')).toBe(true);
		expect(radio?.classList.contains('radio-primary')).toBe(true);
	});

	it('should apply custom class', async () => {
		const { container } = await render(Radio, {
			name: 'format',
			value: '24h',
			class_name: 'radio-accent',
		});

		const radio = container.querySelector('input[type="radio"]');
		expect(radio?.classList.contains('radio-accent')).toBe(true);
	});

	it('should wrap radio in label when label prop is provided', async () => {
		const { container } = await render(Radio, {
			name: 'format',
			value: '24h',
			label: '24-hour format',
		});

		const label = container.querySelector('label');
		expect(label).toBeTruthy();

		const span = label?.querySelector('span');
		expect(span?.textContent).toBe('24-hour format');
	});

	it('should have cursor-pointer on label wrapper', async () => {
		const { container } = await render(Radio, {
			name: 'format',
			value: '24h',
			label: 'Select me',
		});

		const label = container.querySelector('label');
		expect(label?.classList.contains('cursor-pointer')).toBe(true);
	});

	it('should not render label element when no label prop', async () => {
		const { container } = await render(Radio, {
			name: 'format',
			value: '24h',
		});

		// Should be a direct input, not wrapped in label
		const labels = container.querySelectorAll('label');
		expect(labels.length).toBe(0);
	});

	it('should update checked state when rerendered', async () => {
		const { rerender } = await render(Radio, {
			name: 'format',
			value: '24h',
			checked: false,
		});

		const radio = page.getByRole('radio');
		await expect.element(radio).not.toBeChecked();

		await rerender({
			name: 'format',
			value: '24h',
			checked: true,
		});
		await expect.element(radio).toBeChecked();
	});

	it('should handle time format radio use case', async () => {
		await render(Radio, {
			name: 'time_format',
			value: '24h',
			label: '24-hour',
			checked: true,
		});

		const radio = page.getByRole('radio', { name: '24-hour' });
		await expect.element(radio).toBeChecked();
		await expect
			.element(radio)
			.toHaveAttribute('name', 'time_format');
		await expect.element(radio).toHaveAttribute('value', '24h');
	});

	it('should handle date format radio use case', async () => {
		await render(Radio, {
			name: 'date_format',
			value: 'YYYY-MM-DD',
			label: 'YYYY-MM-DD',
			checked: false,
		});

		const radio = page.getByRole('radio', { name: 'YYYY-MM-DD' });
		await expect.element(radio).not.toBeChecked();
		await expect
			.element(radio)
			.toHaveAttribute('value', 'YYYY-MM-DD');
	});

	it('should handle contact sort radio use case', async () => {
		await render(Radio, {
			name: 'default_contact_sort',
			value: 'name',
			label: 'Name (A-Z)',
		});

		const radio = page.getByRole('radio', { name: 'Name (A-Z)' });
		await expect.element(radio).toBeInTheDocument();
		await expect
			.element(radio)
			.toHaveAttribute('name', 'default_contact_sort');
	});
});
