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

	test('drop commits shift semantics: neighbours stay put', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const orderOf = () =>
			page.evaluate(() =>
				Array.from(document.querySelectorAll('.ios-app-grid-page [data-app-id]')).map(el =>
					el.getAttribute('data-app-id')
				)
			);
		const before = await orderOf();
		// Drag the first icon after the third via real mouse input.
		const first = page.locator('.ios-app-grid-page [data-app-id]').first();
		const third = page.locator('.ios-app-grid-page [data-app-id]').nth(2);
		const from = await first.boundingBox();
		const to = await third.boundingBox();
		await page.mouse.move(from!.x + 10, from!.y + 10);
		await page.mouse.down();
		await page.mouse.move(to!.x + 10, to!.y + 10, { steps: 12 });
		await page.mouse.up();
		await page.waitForTimeout(800);

		const after = await orderOf();
		// arrayMove expectation: [b, c, a, ...rest], nothing else jumps.
		expect(after[0]).toBe(before[1]);
		expect(after[1]).toBe(before[2]);
		expect(after[2]).toBe(before[0]);
		expect(after.slice(3)).toEqual(before.slice(3));
		// Layout stays settled afterwards (no post-drop snap).
		await page.waitForTimeout(1500);
		expect(await orderOf()).toEqual(after);
		await page.keyboard.press('Escape');
	});

	test('quick drag-release does not swipe pages', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const icon = page.locator('[data-app-id]').first();
		const box = await icon.boundingBox();
		const sx = box!.x + box!.width / 2;
		const sy = box!.y + box!.height / 2;
		await page.mouse.move(sx, sy);
		await page.mouse.down();
		await page.mouse.move(sx - 100, sy, { steps: 4 });
		await page.mouse.up();
		await page.waitForTimeout(1000);
		// Still on page 0: the slider must not have moved.
		const transform = await page.evaluate(() => {
			const el = document.querySelector('.ios-homescreen div[class*="200vw"]');
			return el ? (el as HTMLElement).style.transform : 'missing';
		});
		expect(transform).toContain('0vw');
		await page.keyboard.press('Escape');
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
