import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ConfirmDialog from './confirm-dialog.svelte';

describe('ConfirmDialog', () => {
	it('should render default message in inline variant', async () => {
		await render(ConfirmDialog, {
			is_inline: true,
		});

		await expect
			.element(page.getByText('Are you sure?'))
			.toBeInTheDocument();
	});

	it('should render custom message in inline variant', async () => {
		await render(ConfirmDialog, {
			is_inline: true,
			message: 'Delete this contact?',
		});

		await expect
			.element(page.getByText('Delete this contact?'))
			.toBeInTheDocument();
	});

	it('should render confirm and cancel buttons with default labels', async () => {
		await render(ConfirmDialog, {});

		const confirmBtn = page.getByRole('button', {
			name: 'Confirm',
		});
		const cancelBtn = page.getByRole('button', { name: 'Cancel' });

		await expect.element(confirmBtn).toBeInTheDocument();
		await expect.element(cancelBtn).toBeInTheDocument();
	});

	it('should render custom button labels', async () => {
		await render(ConfirmDialog, {
			confirm_label: 'Delete',
			cancel_label: 'Keep',
		});

		const confirmBtn = page.getByRole('button', { name: 'Delete' });
		const cancelBtn = page.getByRole('button', { name: 'Keep' });

		await expect.element(confirmBtn).toBeInTheDocument();
		await expect.element(cancelBtn).toBeInTheDocument();
	});

	it('should call on_confirm when confirm button is clicked', async () => {
		const on_confirm = vi.fn();

		await render(ConfirmDialog, {
			on_confirm,
		});

		const confirmBtn = page.getByRole('button', {
			name: 'Confirm',
		});
		await confirmBtn.click();

		expect(on_confirm).toHaveBeenCalledOnce();
	});

	it('should call on_cancel when cancel button is clicked', async () => {
		const on_cancel = vi.fn();

		await render(ConfirmDialog, {
			on_cancel,
		});

		const cancelBtn = page.getByRole('button', { name: 'Cancel' });
		await cancelBtn.click();

		expect(on_cancel).toHaveBeenCalledOnce();
	});

	it('should handle async on_confirm callback', async () => {
		const on_confirm = vi.fn(async () => {
			// Simulate async operation
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		await render(ConfirmDialog, {
			on_confirm,
		});

		const confirmBtn = page.getByRole('button', {
			name: 'Confirm',
		});
		await confirmBtn.click();

		// Wait for async operation to complete
		await vi.waitFor(() => {
			expect(on_confirm).toHaveBeenCalledOnce();
		});
	});

	it('should handle async on_cancel callback', async () => {
		const on_cancel = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		await render(ConfirmDialog, {
			on_cancel,
		});

		const cancelBtn = page.getByRole('button', { name: 'Cancel' });
		await cancelBtn.click();

		await vi.waitFor(() => {
			expect(on_cancel).toHaveBeenCalledOnce();
		});
	});

	it('should render inline variant', async () => {
		await render(ConfirmDialog, {
			is_inline: true,
			message: 'Inline message',
		});

		await expect
			.element(page.getByText('Inline message'))
			.toBeInTheDocument();

		// Inline variant should have text-xs and text-error classes
		const message = page.getByText('Inline message');
		await expect.element(message).toHaveClass(/text-xs/);
		await expect.element(message).toHaveClass(/text-error/);
	});

	it('should hide icons when show_icons is false', async () => {
		await render(ConfirmDialog, {
			show_icons: false,
			confirm_label: 'Yes',
			cancel_label: 'No',
		});

		// Buttons should show text labels instead of icons
		const confirmBtn = page.getByRole('button', { name: 'Yes' });
		const cancelBtn = page.getByRole('button', { name: 'No' });

		await expect.element(confirmBtn).toBeInTheDocument();
		await expect.element(cancelBtn).toBeInTheDocument();
		await expect.element(confirmBtn).toHaveTextContent('Yes');
		await expect.element(cancelBtn).toHaveTextContent('No');
	});

	it('should show icons by default', async () => {
		await render(ConfirmDialog, {
			confirm_label: 'Delete',
		});

		// When show_icons is true (default), the button should have the label as aria-label
		const confirmBtn = page.getByRole('button', { name: 'Delete' });
		await expect.element(confirmBtn).toBeInTheDocument();
		await expect
			.element(confirmBtn)
			.toHaveAttribute('aria-label', 'Delete');
	});

	it('should apply correct styling to confirm button', async () => {
		await render(ConfirmDialog, {});

		const confirmBtn = page.getByRole('button', {
			name: 'Confirm',
		});
		await expect.element(confirmBtn).toHaveClass(/btn-error/);
	});

	it('should handle rapid clicks gracefully', async () => {
		const on_confirm = vi.fn();

		await render(ConfirmDialog, {
			on_confirm,
		});

		const confirmBtn = page.getByRole('button', {
			name: 'Confirm',
		});

		// Click multiple times rapidly
		await confirmBtn.click();
		await confirmBtn.click();
		await confirmBtn.click();

		// All clicks should be registered
		expect(on_confirm.mock.calls.length).toBeGreaterThanOrEqual(3);
	});
});
