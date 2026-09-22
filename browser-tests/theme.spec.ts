import { test, expect } from '@playwright/test';

// The app toggle (not the OS preference) owns dark mode via the .dark class.
test.describe('theme ownership', () => {
	test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });

	test('app dark toggle wins over a light OS', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		// The window content uses a real `dark:` utility (bg-white dark:bg-[#1E1E1E]).
		const contentBg = () =>
			page.evaluate(() => {
				const el = document.querySelector('.window-content');
				return el ? getComputedStyle(el).backgroundColor : 'missing';
			});

		// Turn app dark mode on through the Settings toggle.
		await page.getByRole('button', { name: 'Launch Settings' }).click();
		await expect(page.locator('.window-content')).toBeVisible({ timeout: 10000 });
		expect(await contentBg()).toBe('rgb(255, 255, 255)');
		const darkToggle = page.locator('.w-\\[51px\\].rounded-full').first();
		await darkToggle.click();
		await page.waitForTimeout(500);
		const hasDark = await page.evaluate(() =>
			document.documentElement.className.split(' ').includes('dark')
		);
		expect(hasDark).toBe(true);
		expect(await contentBg()).toBe('rgb(30, 30, 30)');
	});
});
