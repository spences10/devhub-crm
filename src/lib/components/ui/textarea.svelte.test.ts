import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Textarea from './textarea.svelte';

describe('Textarea', () => {
	it('should render textarea with placeholder', async () => {
		await render(Textarea, {
			placeholder: 'Enter your notes...',
		});

		const textarea = page.getByPlaceholder('Enter your notes...');
		await expect.element(textarea).toBeInTheDocument();
	});

	it('should display initial value', async () => {
		await render(Textarea, {
			value: 'Initial content',
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveValue('Initial content');
	});

	it('should handle user input', async () => {
		const on_input = vi.fn();

		await render(Textarea, {
			oninput: on_input,
		});

		const textarea = page.getByRole('textbox');
		await textarea.fill('test content');

		expect(on_input).toHaveBeenCalled();
	});

	it('should set rows attribute', async () => {
		await render(Textarea, {
			rows: 6,
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveAttribute('rows', '6');
	});

	it('should default to 4 rows', async () => {
		await render(Textarea, {});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveAttribute('rows', '4');
	});

	it('should be required when required prop is true', async () => {
		await render(Textarea, {
			required: true,
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveAttribute('required');
	});

	it('should be disabled when disabled prop is true', async () => {
		await render(Textarea, {
			disabled: true,
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toBeDisabled();
	});

	it('should have name attribute', async () => {
		await render(Textarea, {
			name: 'notes',
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveAttribute('name', 'notes');
	});

	it('should apply maxlength attribute', async () => {
		await render(Textarea, {
			maxlength: 500,
		});

		const textarea = page.getByRole('textbox');
		await expect
			.element(textarea)
			.toHaveAttribute('maxlength', '500');
	});

	it('should call oninput when user types', async () => {
		const on_input = vi.fn();

		await render(Textarea, {
			oninput: on_input,
		});

		const textarea = page.getByRole('textbox');
		await textarea.fill('new content');

		expect(on_input).toHaveBeenCalled();
	});

	it('should have textarea base class and w-full', async () => {
		const { container } = await render(Textarea, {});

		const textarea = container.querySelector('textarea');
		expect(textarea?.classList.contains('textarea')).toBe(true);
		expect(textarea?.classList.contains('w-full')).toBe(true);
	});

	it('should apply custom class', async () => {
		const { container } = await render(Textarea, {
			class_name: 'custom-textarea-class',
		});

		const textarea = container.querySelector('textarea');
		expect(
			textarea?.classList.contains('custom-textarea-class'),
		).toBe(true);
	});

	it('should update value when rerendered', async () => {
		const { rerender } = await render(Textarea, {
			value: 'initial content',
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveValue('initial content');

		await rerender({ value: 'updated content' });
		await expect.element(textarea).toHaveValue('updated content');
	});

	it('should support attachment prop for keyboard shortcuts', async () => {
		const attachment = vi.fn(() => {
			return () => {}; // cleanup function
		});

		await render(Textarea, {
			attachment,
		});

		// The attachment function should be called with the textarea element
		expect(attachment).toHaveBeenCalled();
	});

	it('should handle multiline content', async () => {
		const multiline_text = 'Line 1\nLine 2\nLine 3';

		await render(Textarea, {
			value: multiline_text,
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveValue(multiline_text);
	});

	it('should handle empty value', async () => {
		await render(Textarea, {
			value: '',
		});

		const textarea = page.getByRole('textbox');
		await expect.element(textarea).toHaveValue('');
	});

	it('should allow clearing content', async () => {
		await render(Textarea, {
			value: 'some content',
		});

		const textarea = page.getByRole('textbox');
		await textarea.fill('');

		await expect.element(textarea).toHaveValue('');
	});
});
