import { page } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Field from './field.svelte';

describe('Field', () => {
	it('should render fieldset with legend', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		await render(Field, {
			legend: 'Email',
			children,
		});

		const legend = page.getByText('Email');
		await expect.element(legend).toBeInTheDocument();
	});

	it('should render children content', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" placeholder="Enter email" />`,
		}));

		await render(Field, {
			legend: 'Email',
			children,
		});

		const input = page.getByPlaceholder('Enter email');
		await expect.element(input).toBeInTheDocument();
	});

	it('should have fieldset base class', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		const { container } = await render(Field, {
			legend: 'Test',
			children,
		});

		const fieldset = container.querySelector('fieldset');
		expect(fieldset?.classList.contains('fieldset')).toBe(true);
	});

	it('should have fieldset-legend class on legend', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		const { container } = await render(Field, {
			legend: 'Test',
			children,
		});

		const legend = container.querySelector('legend');
		expect(legend?.classList.contains('fieldset-legend')).toBe(true);
	});

	it('should render helper text when provided', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		await render(Field, {
			legend: 'GitHub Username',
			helper_text: 'Enter username without @',
			children,
		});

		await expect
			.element(page.getByText('Enter username without @'))
			.toBeInTheDocument();
	});

	it('should not render helper text when not provided', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		const { container } = await render(Field, {
			legend: 'Name',
			children,
		});

		const paragraphs = container.querySelectorAll('p');
		expect(paragraphs.length).toBe(0);
	});

	it('should apply custom class', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		const { container } = await render(Field, {
			legend: 'Test',
			class_name: 'mb-4',
			children,
		});

		const fieldset = container.querySelector('fieldset');
		expect(fieldset?.classList.contains('mb-4')).toBe(true);
	});

	it('should wrap input in label wrapper pattern', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<label class="input w-full">
					<input type="text" class="grow" />
				</label>
			`,
		}));

		const { container } = await render(Field, {
			legend: 'Name',
			children,
		});

		const label = container.querySelector('label.input');
		expect(label).toBeTruthy();
		expect(label?.classList.contains('w-full')).toBe(true);
	});

	it('should support email field use case', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<label class="validator input w-full">
					<input type="email" class="grow" required />
				</label>
			`,
		}));

		await render(Field, {
			legend: 'Email',
			children,
		});

		const legend = page.getByText('Email');
		await expect.element(legend).toBeInTheDocument();

		const input = page.getByRole('textbox');
		await expect.element(input).toHaveAttribute('type', 'email');
	});

	it('should support date field with helper text use case', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<label class="input w-full">
					<input type="datetime-local" required />
				</label>
			`,
		}));

		await render(Field, {
			legend: 'Due Date',
			helper_text: 'When do you want to follow up with this contact?',
			children,
		});

		await expect
			.element(page.getByText('Due Date'))
			.toBeInTheDocument();
		await expect
			.element(
				page.getByText(
					'When do you want to follow up with this contact?',
				),
			)
			.toBeInTheDocument();
	});

	it('should support select field use case', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<select class="select w-full">
					<option value="1">John Doe</option>
				</select>
			`,
		}));

		const { container } = await render(Field, {
			legend: 'Contact Selector',
			children,
		});

		const legend = container.querySelector('legend');
		expect(legend?.textContent).toBe('Contact Selector');

		const select = page.getByRole('combobox');
		await expect.element(select).toBeInTheDocument();
	});

	it('should support textarea field use case', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<textarea class="textarea w-full" rows="4" placeholder="Additional notes..."></textarea>
			`,
		}));

		await render(Field, {
			legend: 'Notes',
			children,
		});

		const legend = page.getByText('Notes');
		await expect.element(legend).toBeInTheDocument();

		const textarea = page.getByPlaceholder('Additional notes...');
		await expect.element(textarea).toBeInTheDocument();
	});

	it('should support required field pattern', async () => {
		const children = createRawSnippet(() => ({
			render: () => `
				<label class="validator input w-full">
					<input type="text" class="grow" required />
				</label>
			`,
		}));

		await render(Field, {
			legend: 'Name *',
			children,
		});

		const legend = page.getByText('Name *');
		await expect.element(legend).toBeInTheDocument();
	});

	it('should maintain proper semantic structure', async () => {
		const children = createRawSnippet(() => ({
			render: () => `<input type="text" />`,
		}));

		const { container } = await render(Field, {
			legend: 'Test Field',
			helper_text: 'Help text',
			children,
		});

		// Check proper HTML structure
		const fieldset = container.querySelector('fieldset');
		const legend = fieldset?.querySelector('legend');
		const input = fieldset?.querySelector('input');
		const helper = fieldset?.querySelector('p');

		expect(fieldset).toBeTruthy();
		expect(legend?.textContent).toBe('Test Field');
		expect(input).toBeTruthy();
		expect(helper?.textContent).toBe('Help text');
		expect(helper?.classList.contains('label')).toBe(true);
	});
});
