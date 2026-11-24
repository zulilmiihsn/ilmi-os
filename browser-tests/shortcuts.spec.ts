import { test, expect } from '@playwright/test';

// macOS Desktop keyboard shortcuts: Alt+Tab App Switcher, Alt+M minimize, Alt+W close.
test.describe('desktop keyboard shortcuts', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('Alt+Tab opens App Switcher, switches focus on Alt release, and Escape cancels', async ({
		page,
	}) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		// Launch Finder then Notes so Notes is focused on top.
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.getByRole('button', { name: 'Launch Notes' }).click();
		await expect(page.locator('.notes-app')).toBeVisible({ timeout: 10000 });

		const activeMenuLabel = page.locator('.macos-menubar button.font-bold');
		await expect(activeMenuLabel).toHaveText('Notes');

		// Hold Alt + Tab: HUD opens with Finder (previous window) highlighted.
		await page.keyboard.down('Alt');
		await page.keyboard.press('Tab');

		const switcher = page.locator('.app-switcher [role="dialog"][aria-label="App Switcher"]');
		await expect(switcher).toBeVisible({ timeout: 5000 });
		await expect(switcher.getByRole('button', { name: 'Finder' })).toHaveAttribute(
			'aria-current',
			'true'
		);

		// Release Alt commits selection: Finder becomes focused and HUD closes.
		await page.keyboard.up('Alt');
		await expect(switcher).toBeHidden({ timeout: 5000 });
		await expect(activeMenuLabel).toHaveText('Finder');

		// Open switcher again and press Escape: HUD closes without changing focus.
		await page.keyboard.down('Alt');
		await page.keyboard.press('Tab');
		await expect(switcher).toBeVisible({ timeout: 5000 });
		await expect(switcher.getByRole('button', { name: 'Notes' })).toHaveAttribute(
			'aria-current',
			'true'
		);
		await page.keyboard.press('Escape');
		await page.keyboard.up('Alt');
		await expect(switcher).toBeHidden({ timeout: 5000 });
		await expect(activeMenuLabel).toHaveText('Finder');
	});

	test('Alt+M minimizes focused window, Alt+Tab restores it, and Alt+W closes it', async ({
		page,
	}) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });

		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.getByRole('button', { name: 'Launch Notes' }).click();
		await expect(page.locator('.notes-app')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('.window-content')).toHaveCount(2);

		const activeMenuLabel = page.locator('.macos-menubar button.font-bold');
		await expect(activeMenuLabel).toHaveText('Notes');

		// Alt+M minimizes focused Notes: 1 visible window (Finder), Notes hidden.
		await page.keyboard.press('Alt+m');
		await expect(page.locator('.notes-app')).toBeHidden({ timeout: 5000 });
		await expect(page.locator('.window-content')).toHaveCount(1);
		await expect(page.locator('.finder')).toBeVisible();

		// Alt+Tab selects minimized Notes and releasing Alt restores & focuses it.
		await page.keyboard.down('Alt');
		await page.keyboard.press('Tab');
		const switcher = page.locator('.app-switcher [role="dialog"][aria-label="App Switcher"]');
		await expect(switcher).toBeVisible({ timeout: 5000 });
		await expect(switcher.getByRole('button', { name: 'Notes' })).toHaveAttribute(
			'aria-current',
			'true'
		);
		await page.keyboard.up('Alt');
		await expect(switcher).toBeHidden({ timeout: 5000 });
		await expect(page.locator('.notes-app')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.window-content')).toHaveCount(2);
		await expect(activeMenuLabel).toHaveText('Notes');

		// Alt+W closes focused Notes: window count drops back to 1.
		await page.keyboard.press('Alt+w');
		await expect(page.locator('.notes-app')).toBeHidden({ timeout: 5000 });
		await expect(page.locator('.window-content')).toHaveCount(1);
		await expect(page.locator('.finder')).toBeVisible();
	});
});
