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
		if (!box) return;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
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
		if (!box) return;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
		await page.mouse.up();

		// Edit mode persists after drop: icons jiggle and Done is offered.
		await expect(page.locator('.ios-jiggle, .ios-jiggle-reverse').first()).toBeVisible({
			timeout: 5000,
		});
		const doneButton = page.getByRole('button', { name: 'Done editing home screen' });
		await expect(doneButton).toBeVisible();
		// Done fades/scales in and the grid eases down to make room for it.
		const doneAnimation = await doneButton.evaluate(el => getComputedStyle(el).animationName);
		expect(doneAnimation).toMatch(/fadeIn|zoomIn/);
		const gridPadding = () =>
			page.evaluate(() => {
				const slider = document.querySelector('.ios-homescreen div[class*="200vw"]');
				const container = slider?.parentElement;
				if (!container) return 'missing';
				const style = getComputedStyle(container);
				return `${style.paddingTop}|${style.transitionProperty}`;
			});
		// The grid eases down (not jumps) to make room; poll past the transition.
		// pt-24 in rem units (the root font size here is 17px, not 16px).
		const expectedPad = await page.evaluate(
			() => 6 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
		);
		await expect
			.poll(
				async () =>
					page.evaluate(() => {
						const slider = document.querySelector('.ios-homescreen div[class*="200vw"]');
						const container = slider?.parentElement;
						return container ? getComputedStyle(container).paddingTop : 'missing';
					}),
				{ timeout: 3000 }
			)
			.toBe(`${expectedPad}px`);
		expect(await gridPadding()).toContain('padding-top');

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

	test('page dots reflect the home pages', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });
		const dots = page.locator('.ios-homescreen [aria-label^="Page "]');
		await expect(dots).toHaveCount(2);
		await expect(dots.first()).toHaveAttribute('aria-label', 'Page 1 (current)');
	});

	test('closing zooms the app back into its icon', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		await page.locator('[data-app-id]').first().tap();
		const app = page.locator('.ios-app');
		await expect(app).toBeVisible({ timeout: 5000 });
		await page.waitForTimeout(600);
		const fullWidth = await app.evaluate(el => el.getBoundingClientRect().width);

		// Sample frames across the close: like iOS, the app must shrink
		// toward its home icon instead of fading generically.
		await page.evaluate(() => {
			const samples: number[] = [];
			(window as unknown as { __closeWidths: number[] }).__closeWidths = samples;
			const tick = () => {
				const el = document.querySelector('.ios-app');
				if (el) samples.push(el.getBoundingClientRect().width);
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		await page.getByRole('button', { name: 'Close app and return to home screen' }).click();
		await expect(app).toBeHidden({ timeout: 5000 });
		const widths = await page.evaluate(
			() => (window as unknown as { __closeWidths: number[] }).__closeWidths
		);
		expect(widths.length).toBeGreaterThan(3);
		expect(Math.min(...widths)).toBeLessThan(fullWidth * 0.5);
	});
});
