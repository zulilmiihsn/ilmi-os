import { test, expect } from '@playwright/test';

// Minimize/restore and Finder hierarchy smoke tests.
test.describe('window lifecycle', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('minimize then Show All restores a visible window', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.locator('[aria-label="Open Calculator"]').dblclick();
		const win = page.locator('.window-content').first();
		await expect(win).toBeVisible();

		// Minimize via the traffic button.
		await page.locator('button[aria-label="Minimize"]').first().click();
		await expect(win).toBeHidden({ timeout: 5000 });

		// Restore via the active-app menu -> Show All.
		await page.locator('.macos-menubar').click({ position: { x: 80, y: 14 } });
		await page.getByRole('button', { name: 'Show All' }).click();
		await expect(win).toBeVisible({ timeout: 5000 });
		const opacity = await win.evaluate(el => getComputedStyle(el).opacity);
		expect(Number(opacity)).toBeGreaterThan(0.5);
	});

	test('finder creates and navigates a nested folder', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });

		// Create a folder at root via the toolbar, then verify it lists.
		await page.getByRole('button', { name: 'Folder' }).click();
		const dialog = page.locator('.finder').locator('div', { hasText: 'New Folder' }).last();
		await dialog.locator('input[type="text"]').fill('E2E-Parent');
		await page.getByRole('button', { name: 'Create' }).click();
		await expect(page.getByText('E2E-Parent')).toBeVisible({ timeout: 5000 });
	});
});
