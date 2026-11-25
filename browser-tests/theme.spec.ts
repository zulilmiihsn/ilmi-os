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

test.describe('settings interactive views', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('Notifications, Focus, and Storage subviews work end-to-end', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		await page.getByRole('button', { name: 'Launch Settings' }).click();
		const settings = page.locator('.settings-app');
		await expect(settings).toBeVisible({ timeout: 10000 });

		// Notifications subview: send test notification, clear all, return to root.
		await settings.getByRole('button', { name: /Notifications/i }).click();
		await expect(
			settings.getByRole('heading', { name: 'Notifications', exact: true })
		).toBeVisible();
		await settings.getByRole('button', { name: 'Send Test Notification' }).click();
		await expect(settings.getByText('Test Notification', { exact: true })).toBeVisible();
		await settings.getByRole('button', { name: 'Clear All' }).click();
		await expect(settings.getByText('No pending notifications.')).toBeVisible();
		await settings.getByRole('button', { name: 'Settings' }).click();

		// Focus subview: enable Do Not Disturb and confirm root row reflects it.
		await settings.getByRole('button', { name: /Focus/i }).click();
		await expect(settings.getByRole('heading', { name: 'Focus', exact: true })).toBeVisible();
		await settings.getByRole('switch').first().click();
		await expect(settings.getByText(/Do Not Disturb is currently enabled/i)).toBeVisible();
		await settings.getByRole('button', { name: 'Settings' }).click();
		await expect(settings.getByRole('button', { name: /Focus.*Do Not Disturb/i })).toBeVisible();

		// Storage subview: displays live breakdown across categories.
		await settings.getByRole('button', { name: /Storage/i }).click();
		await expect(settings.getByRole('heading', { name: 'Storage', exact: true })).toBeVisible();
		await expect(settings.getByText('iLmi Local Storage')).toBeVisible();
		await expect(settings.getByRole('button', { name: /Files & Finder/i })).toBeVisible();
		await expect(settings.getByRole('button', { name: /Photos/i })).toBeVisible();
	});
});
