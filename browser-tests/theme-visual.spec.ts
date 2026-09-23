import { test, expect } from '@playwright/test';

// Mirror of theme.spec.ts with the OS preference flipped: OS dark while the
// app stays light. Custom app colors (Files iOS blue, Clock orange,
// Terminal monospace) must not follow the OS, and the tab-bar safe-area
// utility must exist in the shipped CSS.
test.describe('theme visuals vs OS preference', () => {
	test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });

	test('app light mode wins over a dark OS without breaking custom visuals', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		// App toggle (default light) owns the window chrome, not the dark OS.
		await page.getByRole('button', { name: 'Launch Settings' }).click();
		await expect(page.locator('.window-content')).toBeVisible({ timeout: 10000 });
		const contentBg = await page.evaluate(() => {
			const el = document.querySelector('.window-content');
			return el ? getComputedStyle(el).backgroundColor : 'missing';
		});
		expect(contentBg).toBe('rgb(255, 255, 255)');

		// Files keeps its custom iOS blue in app light mode.
		await page.locator('[aria-label="Open Files"]').dblclick();
		await expect(page.locator('.files-app')).toBeVisible({ timeout: 10000 });
		const filesBlue = await page.evaluate(() => {
			const el = document.querySelector('.files-app .text-ios-blue');
			return el ? getComputedStyle(el).color : 'missing';
		});
		expect(filesBlue).toBe('rgb(0, 122, 255)');

		// The tab-bar safe-area utility must be defined and applied.
		const safeArea = await page.evaluate(() => {
			const tabBar = document.querySelector('.files-app .pb-safe');
			let ruleFound = false;
			for (const sheet of Array.from(document.styleSheets)) {
				try {
					for (const rule of Array.from(sheet.cssRules)) {
						if (rule.cssText.includes('.pb-safe')) ruleFound = true;
					}
				} catch {
					// Cross-origin sheets are unreadable; skip them.
				}
			}
			return { tabBarPresent: tabBar !== null, ruleFound };
		});
		expect(safeArea.tabBarPresent).toBe(true);
		expect(safeArea.ruleFound).toBe(true);

		// Clock keeps its custom orange active tab in app light mode.
		await page.locator('[aria-label="Open Clock"]').dblclick();
		await expect(page.locator('.clock-app')).toBeVisible({ timeout: 10000 });
		const clockOrange = await page.evaluate(() => {
			const el = document.querySelector('.clock-app [role="tab"][aria-selected="true"]');
			return el ? getComputedStyle(el).color : 'missing';
		});
		expect(clockOrange).toBe('rgb(255, 159, 10)');

		// Terminal keeps a real monospace stack (no font override leaks in).
		await page.locator('[aria-label="Open Terminal"]').dblclick();
		await expect(page.locator('.terminal')).toBeVisible({ timeout: 10000 });
		const terminalFont = await page.evaluate(() => {
			const el = document.querySelector('.terminal');
			return el ? getComputedStyle(el).fontFamily : 'missing';
		});
		expect(terminalFont.toLowerCase()).toContain('monospace');
	});
});
