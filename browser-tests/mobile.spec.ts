import { test, expect } from '@playwright/test';

// Mobile shell: render, drag-cancel recovery, and closed-panel tab order.
test.describe('mobile shell', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

	test('boots to the home screen', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', err => errors.push(err.message));
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });
		expect(errors).toEqual([]);
	});

	test('cancelling a drag restores launch behaviour', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		// Start dragging the first app icon with the mouse, then cancel.
		const icon = page.locator('[data-app-id]').first();
		const box = await icon.boundingBox();
		expect(box).not.toBeNull();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2, { steps: 5 });
		await page.keyboard.press('Escape');
		await page.mouse.up();

		// Body scroll lock must be released and taps must launch apps again.
		expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
		await icon.tap();
		await expect(page.locator('.ios-app')).toBeVisible({ timeout: 5000 });
	});

	test('dragging enters jiggle edit mode with a Done action', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const icon = page.locator('[data-app-id]').first();
		const box = await icon.boundingBox();
		expect(box).not.toBeNull();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2, { steps: 5 });
		await page.mouse.up();

		// Edit mode persists after drop: icons jiggle and Done is offered.
		await expect(page.locator('.ios-jiggle, .ios-jiggle-reverse').first()).toBeVisible({
			timeout: 5000,
		});
		await expect(page.getByRole('button', { name: 'Done editing home screen' })).toBeVisible();

		// Escape leaves edit mode.
		await page.keyboard.press('Escape');
		await expect(page.locator('.ios-jiggle, .ios-jiggle-reverse')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Done editing home screen' })).toBeHidden();
	});

	test('closed notification center keeps no keyboard focus', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const sheet = page.locator('.ios-cover-sheet');
		// Tab through the interface; focus must never land inside the closed sheet.
		await page.keyboard.press('Tab');
		for (let i = 0; i < 40; i++) {
			const inside = await sheet.evaluate(
				(el, active) => el.contains(active),
				await page.evaluateHandle(() => document.activeElement)
			);
			expect(inside).toBe(false);
			await page.keyboard.press('Tab');
		}
	});
});
