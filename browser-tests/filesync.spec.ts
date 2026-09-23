import { test, expect } from '@playwright/test';

// Same-document live sync: a Terminal mkdir must appear in an already-open
// Finder without any manual refresh. Native `storage` events only fire in
// *other* documents, so the writer document needs a local notification.
test.describe('filesystem live sync', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('finder shows a folder created in terminal while both are open', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });

		await page.locator('[aria-label="Open Terminal"]').dblclick();
		await expect(page.locator('.terminal')).toBeVisible({ timeout: 10000 });

		const terminalInput = page.locator('.terminal input');
		await terminalInput.click();
		await terminalInput.fill('mkdir SyncProbeLive');
		await terminalInput.press('Enter');
		await expect(page.locator('.terminal')).toContainText('Created directory: SyncProbeLive', {
			timeout: 5000,
		});

		// Finder must pick this up on its own — no interaction with Finder allowed here.
		await expect(page.locator('.finder').getByText('SyncProbeLive')).toBeVisible({
			timeout: 5000,
		});
	});
});
