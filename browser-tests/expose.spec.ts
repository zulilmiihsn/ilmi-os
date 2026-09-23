import { test, expect } from '@playwright/test';

// Exposé-lite (Mission Control approximation): F3 spreads all open windows —
// minimized ones included — into tiles; clicking (or Enter on) a tile focuses
// it, Esc exits without changing anything.
test.describe('exposé', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('F3 spreads windows and clicking a tile focuses it', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.locator('[aria-label="Open Calculator"]').dblclick();
		await expect(page.locator('.window-content')).toHaveCount(2);

		await page.keyboard.press('F3');
		await expect(page.locator('.expose-tile')).toHaveCount(2, { timeout: 5000 });
		await expect(page.locator('.expose-dim')).toBeVisible();

		// Tiles shrink windows into a grid: each tile is smaller than its window.
		const shrunk = await page.evaluate(() => {
			const tiles = Array.from(document.querySelectorAll('.expose-tile'));
			return tiles.every(el => {
				const r = el.getBoundingClientRect();
				return r.width < 1440 && r.height < 900 && r.width > 0 && r.height > 0;
			});
		});
		expect(shrunk).toBe(true);

		await page.locator('.expose-tile').first().click();
		await expect(page.locator('.expose-tile')).toHaveCount(0, { timeout: 5000 });
		await expect(page.locator('.window-content').first()).toBeVisible();
	});

	test('minimized windows tile too and Esc exits without changes', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.locator('button[aria-label="Minimize"]').first().click();
		const win = page.locator('.window-content').first();
		await expect(win).toBeHidden({ timeout: 5000 });

		await page.keyboard.press('F3');
		// The minimized Finder still gets a live tile.
		await expect(page.locator('.expose-tile')).toHaveCount(1, { timeout: 5000 });

		await page.keyboard.press('Escape');
		await expect(page.locator('.expose-tile')).toHaveCount(0, { timeout: 5000 });
		// Exiting without a pick leaves the window minimized.
		await expect(win).toBeHidden({ timeout: 5000 });
	});
});
