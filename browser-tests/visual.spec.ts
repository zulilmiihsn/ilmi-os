import { test, expect, type Page } from '@playwright/test';

// Visual regression: pixel baselines committed under
// browser-tests/visual.spec.ts-snapshots/. Regenerate intentionally with
// `playwright test visual.spec --update-snapshots` after deliberate UI changes.
// CI renders with a different Chromium build/fonts, so expect to regenerate
// baselines from CI once, then keep them stable.
// Deterministic rendering: freeze the clock (status bar, calendar icon,
// widget) and Math.random (window cascade offsets) before navigation.
async function prepareDeterministicPage(page: Page) {
	await page.clock.install({ time: new Date('2026-09-22T12:00:00') });
	await page.addInitScript(() => {
		Math.random = () => 0.5;
	});
}

test.describe('visual regression', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('desktop home', async ({ page }) => {
		await prepareDeterministicPage(page);
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot('desktop-home.png', {
			animations: 'disabled',
			caret: 'hide',
			// Tolerance for subpixel font antialiasing jitter between runs.
			maxDiffPixels: 200,
		});
	});

	test('finder window', async ({ page }) => {
		await prepareDeterministicPage(page);
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		// Park the mouse inside the window: the dock tooltip must not leak
		// into the resting-state baseline (hover states have dedicated tests).
		await page.locator('.finder').hover();
		await page.waitForTimeout(800);
		await expect(page).toHaveScreenshot('finder-window.png', {
			animations: 'disabled',
			caret: 'hide',
			// Tolerance for subpixel font antialiasing jitter between runs.
			maxDiffPixels: 200,
		});
	});
});

test.describe('visual regression (mobile)', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

	test('mobile home', async ({ page }) => {
		await prepareDeterministicPage(page);
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot('mobile-home.png', {
			animations: 'disabled',
			caret: 'hide',
			// Tolerance for subpixel font antialiasing jitter between runs.
			maxDiffPixels: 200,
		});
	});
});
