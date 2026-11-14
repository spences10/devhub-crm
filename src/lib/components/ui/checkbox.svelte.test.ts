import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Checkbox from './checkbox.svelte';

describe('Checkbox', () => {
	it('should render checkbox without label', async () => {
		await render(Checkbox, {});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).toBeInTheDocument();
	});

	it('should render checkbox with label', async () => {
		await render(Checkbox, {
			label: 'Mark as VIP',
		});

		const checkbox = page.getByRole('checkbox', {
			name: 'Mark as VIP',
		});
		await expect.element(checkbox).toBeInTheDocument();
	});

	it('should be unchecked by default', async () => {
		await render(Checkbox, {});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).not.toBeChecked();
	});

	it('should be checked when checked prop is true', async () => {
		await render(Checkbox, {
			checked: true,
		});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).toBeChecked();
	});

	it('should toggle when clicked', async () => {
		await render(Checkbox, {
			checked: false,
		});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).not.toBeChecked();

		await checkbox.click();
		await expect.element(checkbox).toBeChecked();
	});

	it('should call onchange when checked state changes', async () => {
		const on_change = vi.fn();

		await render(Checkbox, {
			onchange: on_change,
		});

		const checkbox = page.getByRole('checkbox');
		await checkbox.click();

		expect(on_change).toHaveBeenCalled();
	});

	it('should be disabled when disabled prop is true', async () => {
		await render(Checkbox, {
			disabled: true,
		});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).toBeDisabled();
	});

	it('should have name attribute', async () => {
		await render(Checkbox, {
			name: 'is_vip',
		});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).toHaveAttribute('name', 'is_vip');
	});

	it('should have checkbox base class', async () => {
		const { container } = await render(Checkbox, {});

		const checkbox = container.querySelector(
			'input[type="checkbox"]',
		);
		expect(checkbox?.classList.contains('checkbox')).toBe(true);
	});

	it('should apply custom class', async () => {
		const { container } = await render(Checkbox, {
			class_name: 'checkbox-primary',
		});

		const checkbox = container.querySelector(
			'input[type="checkbox"]',
		);
		expect(checkbox?.classList.contains('checkbox-primary')).toBe(
			true,
		);
	});

	it('should wrap checkbox in label when label prop is provided', async () => {
		const { container } = await render(Checkbox, {
			label: 'Accept terms',
		});

		const label = container.querySelector('label');
		expect(label).toBeTruthy();

		const span = label?.querySelector('span');
		expect(span?.textContent).toBe('Accept terms');
	});

	it('should have cursor-pointer on label wrapper', async () => {
		const { container } = await render(Checkbox, {
			label: 'Click me',
		});

		const label = container.querySelector('label');
		expect(label?.classList.contains('cursor-pointer')).toBe(true);
	});

	it('should update checked state when rerendered', async () => {
		const { rerender } = await render(Checkbox, {
			checked: false,
		});

		const checkbox = page.getByRole('checkbox');
		await expect.element(checkbox).not.toBeChecked();

		await rerender({ checked: true });
		await expect.element(checkbox).toBeChecked();
	});

	it('should handle VIP checkbox use case', async () => {
		await render(Checkbox, {
			name: 'is_vip',
			checked: true,
			label: 'Mark as VIP',
		});

		const checkbox = page.getByRole('checkbox', {
			name: 'Mark as VIP',
		});
		await expect.element(checkbox).toBeChecked();
		await expect.element(checkbox).toHaveAttribute('name', 'is_vip');
	});

	it('should not render label element when no label prop', async () => {
		const { container } = await render(Checkbox, {});

		// Should be a direct input, not wrapped in label
		const labels = container.querySelectorAll('label');
		expect(labels.length).toBe(0);
	});

	it('should maintain state through multiple interactions', async () => {
		await render(Checkbox, {
			checked: false,
		});

		const checkbox = page.getByRole('checkbox');

		// Click to check
		await checkbox.click();
		await expect.element(checkbox).toBeChecked();

		// Click to uncheck
		await checkbox.click();
		await expect.element(checkbox).not.toBeChecked();

		// Click to check again
		await checkbox.click();
		await expect.element(checkbox).toBeChecked();
	});
});
