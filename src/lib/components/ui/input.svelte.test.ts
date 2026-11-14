import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Input from './input.svelte';

describe('Input', () => {
	it('should render text input with placeholder', async () => {
		await render(Input, {
			type: 'text',
			placeholder: 'Enter your name',
		});

		const input = page.getByPlaceholder('Enter your name');
		await expect.element(input).toBeInTheDocument();
	});

	it('should display initial value', async () => {
		await render(Input, {
			value: 'John Doe',
		});

		const input = page.getByRole('textbox');
		await expect.element(input).toHaveValue('John Doe');
	});

	it('should handle user input', async () => {
		const on_input = vi.fn();

		await render(Input, {
			oninput: on_input,
		});

		const input = page.getByRole('textbox');
		await input.fill('test input');

		expect(on_input).toHaveBeenCalled();
	});

	it('should support email type', async () => {
		await render(Input, {
			type: 'email',
			placeholder: 'you@example.com',
		});

		const input = page.getByPlaceholder('you@example.com');
		await expect.element(input).toHaveAttribute('type', 'email');
	});

	it('should support password type', async () => {
		await render(Input, {
			type: 'password',
			placeholder: 'Password',
		});

		const input = page.getByPlaceholder('Password');
		await expect.element(input).toHaveAttribute('type', 'password');
	});

	it('should support tel type', async () => {
		await render(Input, {
			type: 'tel',
			placeholder: '+1 (555) 123-4567',
		});

		const input = page.getByPlaceholder('+1 (555) 123-4567');
		await expect.element(input).toHaveAttribute('type', 'tel');
	});

	it('should support date type', async () => {
		await render(Input, {
			type: 'date',
		});

		const input = page.getByRole('textbox');
		await expect.element(input).toHaveAttribute('type', 'date');
	});

	it('should support datetime-local type', async () => {
		await render(Input, {
			type: 'datetime-local',
		});

		const input = page.getByRole('textbox');
		await expect
			.element(input)
			.toHaveAttribute('type', 'datetime-local');
	});

	it('should support number type', async () => {
		await render(Input, {
			type: 'number',
			min: 1,
			max: 90,
		});

		const input = page.getByRole('spinbutton');
		await expect.element(input).toHaveAttribute('type', 'number');
		await expect.element(input).toHaveAttribute('min', '1');
		await expect.element(input).toHaveAttribute('max', '90');
	});

	it('should support url type', async () => {
		await render(Input, {
			type: 'url',
			placeholder: 'https://example.com',
		});

		const input = page.getByPlaceholder('https://example.com');
		await expect.element(input).toHaveAttribute('type', 'url');
	});

	it('should be required when required prop is true', async () => {
		await render(Input, {
			required: true,
			placeholder: 'Required field',
		});

		const input = page.getByPlaceholder('Required field');
		await expect.element(input).toHaveAttribute('required');
	});

	it('should be disabled when disabled prop is true', async () => {
		await render(Input, {
			disabled: true,
			placeholder: 'Disabled field',
		});

		const input = page.getByPlaceholder('Disabled field');
		await expect.element(input).toBeDisabled();
	});

	it('should apply validator class when validator prop is true', async () => {
		const { container } = await render(Input, {
			validator: true,
			type: 'email',
		});

		// Check that the label wrapper has validator class
		const label = container.querySelector('label');
		expect(label?.classList.contains('validator')).toBe(true);
	});

	it('should not apply validator class by default', async () => {
		const { container } = await render(Input, {
			type: 'email',
		});

		const label = container.querySelector('label');
		expect(label?.classList.contains('validator')).toBe(false);
	});

	it('should have name attribute', async () => {
		await render(Input, {
			name: 'email',
			placeholder: 'Email',
		});

		const input = page.getByPlaceholder('Email');
		await expect.element(input).toHaveAttribute('name', 'email');
	});

	it('should apply minlength attribute', async () => {
		await render(Input, {
			type: 'password',
			minlength: 8,
			placeholder: 'Password',
		});

		const input = page.getByPlaceholder('Password');
		await expect.element(input).toHaveAttribute('minlength', '8');
	});

	it('should apply maxlength attribute', async () => {
		await render(Input, {
			maxlength: 30,
			placeholder: 'Tag name',
		});

		const input = page.getByPlaceholder('Tag name');
		await expect.element(input).toHaveAttribute('maxlength', '30');
	});

	it('should call oninput when user types', async () => {
		const on_input = vi.fn();

		await render(Input, {
			oninput: on_input,
			placeholder: 'Test',
		});

		const input = page.getByPlaceholder('Test');
		await input.fill('new value');

		expect(on_input).toHaveBeenCalled();
	});

	it('should have input wrapper with w-full class', async () => {
		const { container } = await render(Input, {});

		const label = container.querySelector('label');
		expect(label?.classList.contains('w-full')).toBe(true);
		expect(label?.classList.contains('input')).toBe(true);
	});

	it('should have input with grow class', async () => {
		const { container } = await render(Input, {});

		const input = container.querySelector('input');
		expect(input?.classList.contains('grow')).toBe(true);
	});

	it('should apply custom class to input', async () => {
		const { container } = await render(Input, {
			class_name: 'custom-input-class',
		});

		const input = container.querySelector('input');
		expect(input?.classList.contains('custom-input-class')).toBe(
			true,
		);
	});

	it('should update value when rerendered', async () => {
		const { rerender } = await render(Input, {
			value: 'initial',
		});

		const input = page.getByRole('textbox');
		await expect.element(input).toHaveValue('initial');

		await rerender({ value: 'updated' });
		await expect.element(input).toHaveValue('updated');
	});

	it('should handle numeric values', async () => {
		const { container } = await render(Input, {
			type: 'number',
			value: 42,
		});

		const input = container.querySelector(
			'input[type="number"]',
		) as HTMLInputElement;
		// Numeric values are bound via Svelte, check the actual DOM property
		expect(input?.value).toBe('42');
	});

	it('should support attachment prop for keyboard shortcuts', async () => {
		const attachment = vi.fn(() => {
			return () => {}; // cleanup function
		});

		await render(Input, {
			attachment,
		});

		// The attachment function should be called with the input element
		expect(attachment).toHaveBeenCalled();
	});
});
