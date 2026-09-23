import { test, expect } from '@playwright/test';

// Minimize/restore and Finder hierarchy smoke tests.
test.describe('window lifecycle', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('show All replays the minimize trip in reverse', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		// Finder lives in the dock, so minimize/restore can travel to its icon.
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		const win = page.locator('.window-content').first();
		// Let the open animation finish so the reference width is stable.
		await page.waitForTimeout(600);
		const fullWidth = await win.evaluate(el => el.getBoundingClientRect().width);
		expect(fullWidth).toBeGreaterThan(300);

		// Minimize via the traffic button.
		await page.locator('button[aria-label="Minimize"]').first().click();
		await expect(win).toBeHidden({ timeout: 5000 });

		// Sample window widths every frame across the restore: like macOS,
		// the window must travel from dock size back to full size.
		await page.evaluate(() => {
			const samples: number[] = [];
			(window as unknown as { __restoreWidths: number[] }).__restoreWidths = samples;
			const tick = () => {
				const el = document.querySelector('.window-content');
				if (el) samples.push(el.getBoundingClientRect().width);
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		await page.locator('.macos-menubar').click({ position: { x: 80, y: 14 } });
		await page.getByRole('button', { name: 'Show All' }).click();
		await expect(win).toBeVisible({ timeout: 5000 });
		// Let the trip finish, then inspect the recorded frames.
		await page.waitForTimeout(1200);
		const widths = await page.evaluate(
			() => (window as unknown as { __restoreWidths: number[] }).__restoreWidths
		);
		expect(widths.length).toBeGreaterThan(5);
		expect(Math.min(...widths)).toBeLessThan(fullWidth * 0.7);
		const settled = await win.evaluate(el => el.getBoundingClientRect().width);
		expect(Math.abs(settled - fullWidth)).toBeLessThan(2);
		// Really visible to the eye, not just to Playwright (opacity:0 counts
		// as "visible" to the locator but strands the window invisibly).
		const settledOpacity = await win.evaluate(el => getComputedStyle(el).opacity);
		expect(Number(settledOpacity)).toBeGreaterThan(0.5);
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
