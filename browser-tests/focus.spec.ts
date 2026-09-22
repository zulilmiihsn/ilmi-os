import { test, expect } from '@playwright/test';

// Focus entry + return for dialogs.
test.describe('dialog focus management', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('finder dialog returns focus to its trigger', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });

		const folderBtn = page.getByRole('button', { name: 'Folder' });
		await folderBtn.click();
		const dialog = page.locator('.finder').locator('div', { hasText: 'New Folder' }).last();
		const dialogInput = dialog.locator('input[type="text"]');
		await expect(dialogInput).toBeFocused();
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(folderBtn).toBeFocused();
	});

	test('spotlight returns focus to its trigger', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		const searchBtn = page.getByRole('button', { name: 'Search' });
		await searchBtn.click();
		const input = page.locator('.spotlight-container input');
		await expect(input).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(searchBtn).toBeFocused();
	});
});
