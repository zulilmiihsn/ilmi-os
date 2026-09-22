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
		// Fast travel: lingering 800ms over an icon would (correctly)
		// create a folder instead of reordering.
		const first = page.locator('.ios-app-grid-page [data-app-id]').first();
		const third = page.locator('.ios-app-grid-page [data-app-id]').nth(2);
		const from = await first.boundingBox();
		const to = await third.boundingBox();
		await page.mouse.move(from!.x + 10, from!.y + 10);
		await page.mouse.down();
		await page.mouse.move(to!.x + 10, to!.y + 10, { steps: 3 });
		await page.mouse.up();
		await page.waitForTimeout(800);

		const after = await orderOf();
		// The dragged icon moved and nothing was lost or duplicated.
		expect(after).toHaveLength(before.length);
		expect(new Set(after).size).toBe(after.length);
		expect(after).toEqual(expect.arrayContaining(before));
		expect(after.indexOf(before[0])).toBeGreaterThan(0);
		// Layout stays settled afterwards (no post-drop snap or jump).
		await page.waitForTimeout(1500);
		expect(await orderOf()).toEqual(after);
		await page.keyboard.press('Escape');
	});

	test('hovering an app over another creates a folder', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const icons = page.locator('.ios-app-grid-page [data-app-id]');
		const firstName = await icons.nth(0).getAttribute('data-app-id');
		const secondName = await icons.nth(1).getAttribute('data-app-id');
		const from = await icons.nth(0).boundingBox();
		const to = await icons.nth(1).boundingBox();
		await page.mouse.move(from!.x + 10, from!.y + 10);
		await page.mouse.down();
		await page.mouse.move(to!.x + 10, to!.y + 10, { steps: 12 });
		// Hold over the target past the 800ms folder timer, then drop.
		await page.waitForTimeout(1400);
		await page.mouse.up();
		await page.waitForTimeout(800);

		// A folder took the target slot; both apps left the grid.
		// (Exact label: the dnd-kit sortable wrapper also exposes the name.)
		const folderButton = page.getByLabel('Open folder Folder, 2 apps');
		await expect(folderButton).toBeVisible({
			timeout: 5000,
		});
		const gridIds = await page.evaluate(() =>
			Array.from(document.querySelectorAll('.ios-app-grid-page [data-app-id]')).map(el =>
				el.getAttribute('data-app-id')
			)
		);
		expect(gridIds).not.toContain(firstName);
		expect(gridIds).not.toContain(secondName);

		// Open the folder: both members listed; removing one dissolves it.
		// force: jiggling icons never satisfy stability checks; real taps work.
		await folderButton.click({ force: true });
		await expect(page.getByRole('dialog', { name: 'Folder folder' })).toBeVisible();
		const removeButtons = page.getByRole('button', { name: /Remove .* from folder/ });
		expect(await removeButtons.count()).toBe(2);
		await removeButtons.first().click();
		await page.waitForTimeout(500);
		const gridAfter = await page.evaluate(() =>
			Array.from(document.querySelectorAll('.ios-app-grid-page [data-app-id]')).map(el =>
				el.getAttribute('data-app-id')
			)
		);
		expect(gridAfter).toContain(firstName);
		expect(gridAfter).toContain(secondName);
		await expect(page.getByLabel('Open folder Folder, 2 apps')).toBeHidden();
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
