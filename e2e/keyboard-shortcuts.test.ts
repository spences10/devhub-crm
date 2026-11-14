import { expect, test } from '@playwright/test';

// Helper to authenticate with demo account
async function login_as_demo(page: any) {
	await page.goto('/');

	// Click "Try Demo - No Signup" button
	const demo_button = page.getByRole('button', {
		name: 'Try Demo - No Signup',
	});
	await demo_button.click();

	// Wait for redirect to dashboard
	await page.waitForURL(/\/dashboard/);

	// Wait for the page to be fully loaded by checking for demo banner
	await page.waitForSelector("text=You're in demo mode", {
		timeout: 10000,
	});
}

// Helper to set date field to a future date
async function set_future_date(page: any, days: number = 7) {
	const future_date = new Date(
		Date.now() + days * 24 * 60 * 60 * 1000,
	);
	// Zero out seconds and milliseconds since datetime-local only supports minute precision
	future_date.setSeconds(0, 0);

	const date_string = future_date.toISOString().slice(0, 16);
	await page
		.locator('input[type="datetime-local"]')
		.fill(date_string);

	// Wait for the hidden input to be updated by Svelte's reactivity
	const expected_timestamp = future_date.getTime().toString();
	await expect(page.locator('input[name^="due_date/"]')).toHaveValue(
		expected_timestamp,
	);
}

test.describe('Keyboard Shortcuts - ctrl_enter_submit', () => {
	test('should submit follow-up form with Ctrl+Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/follow-ups/new');

		// Wait for form to be fully loaded
		const contact_select = page.locator(
			'select[name^="contact_id/"]',
		);
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		await set_future_date(page);

		const textarea = page.getByPlaceholder(
			/what do you need to follow up about/i,
		);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Test follow-up with Ctrl+Enter');

		// Press Ctrl+Enter and wait for navigation
		await Promise.all([
			page.waitForURL(/\/contacts\//),
			textarea.press('Control+Enter'),
		]);
	});

	test('should submit follow-up form with Cmd+Enter (Mac)', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/follow-ups/new');

		// Wait for form to be fully loaded
		const contact_select = page.locator(
			'select[name^="contact_id/"]',
		);
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		await set_future_date(page);

		const textarea = page.getByPlaceholder(
			/what do you need to follow up about/i,
		);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Test follow-up with Cmd+Enter');

		// Press Cmd+Enter
		await textarea.press('Meta+Enter');

		// Should navigate to the contact detail page
		await expect(page).toHaveURL(/\/contacts\//);
	});

	test('should submit interaction form with Ctrl+Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/interactions/new');

		// Select a contact - wait for options to load first
		const contact_select = page.locator(
			'select[name^="contact_id/"]',
		);
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		// Select interaction type - wait for options to load
		const type_select = page.locator('select[name^="type/"]');
		await expect(type_select.locator('option')).not.toHaveCount(1);
		await type_select.selectOption({ index: 1 });

		const textarea = page.getByPlaceholder(
			/add any notes about this interaction/i,
		);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Test interaction with Ctrl+Enter');

		await textarea.press('Control+Enter');

		// Should navigate to the contact detail page
		await expect(page).toHaveURL(/\/contacts\//);
	});

	test('should allow multiline text with plain Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/follow-ups/new');

		// Wait for form to be fully loaded
		const contact_select = page.locator(
			'select[name^="contact_id/"]',
		);
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		await set_future_date(page);

		const textarea = page.getByPlaceholder(
			/what do you need to follow up about/i,
		);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Line 1');
		await textarea.press('Enter');
		await textarea.type('Line 2');

		const value = await textarea.inputValue();
		expect(value).toContain('Line 1\nLine 2');

		// Should still be on the new page
		await expect(page).toHaveURL(/\/follow-ups\/new/);
	});
});

test.describe('Keyboard Shortcuts - ctrl_enter_callback', () => {
	test('should save contact notes with Ctrl+Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/contacts');

		// Click on first contact row to view details
		await page.locator('tbody tr').first().click();
		await page.waitForURL(/\/contacts\/.+/);

		// Click edit link on contact detail page
		const edit_link = page.getByRole('link', {
			name: /edit contact/i,
		});
		await edit_link.click();
		await page.waitForURL(/\/contacts\/.*\/edit/);

		const textarea = page.getByPlaceholder(
			/additional notes about this contact/i,
		);
		await textarea.waitFor({ state: 'visible' });
		const test_note = `Updated note at ${Date.now()}`;
		await textarea.fill(test_note);

		// Press Ctrl+Enter to save
		await textarea.press('Control+Enter');

		// Wait for save indicator
		await expect(page.getByText(/saving/i)).toBeVisible();
	});

	test('should save contact notes with Cmd+Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/contacts');

		// Click on first contact row to view details
		await page.locator('tbody tr').first().click();
		await page.waitForURL(/\/contacts\/.+/);

		// Click edit link on contact detail page
		const edit_link = page.getByRole('link', {
			name: /edit contact/i,
		});
		await edit_link.click();
		await page.waitForURL(/\/contacts\/.*\/edit/);

		const textarea = page.getByPlaceholder(
			/additional notes about this contact/i,
		);
		await textarea.waitFor({ state: 'visible' });
		const test_note = `Updated note with Cmd+Enter at ${Date.now()}`;
		await textarea.fill(test_note);

		// Press Cmd+Enter to save
		await textarea.press('Meta+Enter');

		await expect(page.getByText(/saving/i)).toBeVisible();
	});

	test('should save interaction edit with Ctrl+Enter', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/contacts');

		// Click on first contact row to view details
		await page.locator('tbody tr').first().click();
		await page.waitForURL(/\/contacts\/.+/);

		// Look for edit button on an interaction
		const edit_button = page
			.getByRole('button', { name: /edit/i })
			.first();

		await edit_button.click();

		// Find the textarea in edit mode
		const textarea = page.getByPlaceholder(/add a note/i);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Updated interaction note');

		// Press Ctrl+Enter to save
		await textarea.press('Control+Enter');

		// Textarea should disappear (exit edit mode)
		await expect(textarea).not.toBeVisible();
	});

	test('should allow multiline notes in contact edit', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/contacts');

		// Click on first contact row to view details
		await page.locator('tbody tr').first().click();
		await page.waitForURL(/\/contacts\/.+/);

		// Click edit link on contact detail page
		const edit_link = page.getByRole('link', {
			name: /edit contact/i,
		});
		await edit_link.click();
		await page.waitForURL(/\/contacts\/.*\/edit/);

		const textarea = page.getByPlaceholder(
			/additional notes about this contact/i,
		);
		await textarea.waitFor({ state: 'visible' });
		await textarea.fill('Line 1');
		await textarea.press('Enter');
		await textarea.type('Line 2');

		const value = await textarea.inputValue();
		expect(value).toContain('Line 1\nLine 2');
	});
});

test.describe('Keyboard Shortcuts - Cross-Platform', () => {
	test('should work consistently across Windows/Linux (Ctrl) and Mac (Cmd)', async ({
		page,
	}) => {
		await login_as_demo(page);

		await page.goto('/follow-ups/new');

		// Wait for form to be fully loaded
		const contact_select = page.locator(
			'select[name^="contact_id/"]',
		);
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		await set_future_date(page);

		const textarea = page.getByPlaceholder(
			/what do you need to follow up about/i,
		);
		await textarea.waitFor({ state: 'visible' });

		// Test Ctrl variant
		await textarea.fill('Test Ctrl');
		await textarea.press('Control+Enter');

		// Should have submitted and navigated to contact detail page
		await page.waitForURL(/\/contacts\//);

		// Go back and test Meta variant
		await page.goto('/follow-ups/new');
		await expect(contact_select.locator('option')).not.toHaveCount(1);
		await contact_select.selectOption({ index: 2 });

		await textarea.fill('Test Meta');
		await textarea.press('Meta+Enter');

		// Should have submitted again
		await page.waitForURL(/\/contacts\//);
	});
});
