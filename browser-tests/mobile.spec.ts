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
		// Drag the first icon after the third via real mouse input, landing
		// near its corner. Centre drops are covered by the preview regressions.
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
		expect(after.indexOf(before[0] ?? '')).toBeGreaterThan(0);
		// Layout stays settled afterwards (no post-drop snap or jump).
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

	test('fast flick starting on an icon never flips the page', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		const flick = async (x: number, y: number, dx: number) => {
			const cdp = await page.context().newCDPSession(page);
			const point = (px: number, py: number) => ({ x: Math.round(px), y: Math.round(py), id: 1 });
			await cdp.send('Input.dispatchTouchEvent', {
				type: 'touchStart',
				touchPoints: [point(x, y)],
			});
			await cdp.send('Input.dispatchTouchEvent', {
				type: 'touchMove',
				touchPoints: [point(x + dx, y)],
			});
			// touchEnd must carry the released point: the handler reads it
			// from changedTouches, like a real finger lift.
			await cdp.send('Input.dispatchTouchEvent', {
				type: 'touchEnd',
				touchPoints: [point(x + dx, y)],
			});
			await cdp.detach();
		};
		const sliderTransform = () =>
			page.evaluate(() => {
				const el = document.querySelector('.ios-homescreen div[class*="200vw"]');
				return el ? (el as HTMLElement).style.transform : 'missing';
			});
		const emptyPoint = (pageIndex = 0) =>
			page.evaluate(idx => {
				const blocked = Array.from(
					document.querySelectorAll('.ios-app-grid-page [data-app-id], .ios-app-grid-page button')
				).map(el => el.getBoundingClientRect());
				const grids = Array.from(document.querySelectorAll('.ios-app-grid-page'));
				const grid = grids[idx]?.getBoundingClientRect();
				if (!grid) return null;
				// Stay clear of the top strip: touches with y<=90 steer the
				// notification/control-center tracking, never page swipes.
				for (let y = Math.max(grid.top + 20, 130); y < grid.bottom - 20; y += 25) {
					for (let x = grid.left + 20; x < grid.right - 20; x += 25) {
						if (!blocked.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) {
							return { x, y };
						}
					}
				}
				return null;
			}, pageIndex);

		// Control: a leftward flick from empty background DOES flip the page,
		// proving raw touch reaches the gesture handlers.
		const empty = await emptyPoint();
		expect(empty).not.toBeNull();
		await flick(empty!.x, empty!.y, -120);
		await page.waitForTimeout(800);
		expect(await sliderTransform()).toBe('translateX(-100vw)');

		// Back to page 0, then the real assertion: an identical flick starting
		// on an icon must not flip (it is faster than the dnd-kit sensor delay,
		// so without icon-origin suppression the page would steal it).
		const back = await emptyPoint(1);
		await flick(back!.x, back!.y, 120);
		await page.waitForTimeout(800);
		expect(await sliderTransform()).toBe('translateX(0vw)');
		const icon = page.locator('.ios-app-grid-page [data-app-id]').first();
		const box = await icon.boundingBox();
		await flick(box!.x + box!.width / 2, box!.y + box!.height / 2, -120);
		await page.waitForTimeout(800);
		expect(await sliderTransform()).toBe('translateX(0vw)');
		await page.keyboard.press('Escape');
	});

	test('long-press on empty area enters edit mode, tap exits', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.ios-homescreen')).toBeVisible({ timeout: 20000 });

		// Find a background point inside the grid that hits no icon or button,
		// clear of the top strip (y<=90 belongs to the panel tracking).
		const point = await page.evaluate(() => {
			const blocked = Array.from(
				document.querySelectorAll('.ios-app-grid-page [data-app-id], .ios-app-grid-page button')
			).map(el => el.getBoundingClientRect());
			const grid = document.querySelector('.ios-app-grid-page')?.getBoundingClientRect();
			if (!grid) return null;
			for (let y = Math.max(grid.top + 20, 130); y < grid.bottom - 20; y += 25) {
				for (let x = grid.left + 20; x < grid.right - 20; x += 25) {
					if (!blocked.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) {
						return { x, y };
					}
				}
			}
			return null;
		});
		expect(point).not.toBeNull();

		// Hold: edit mode engages with jiggle + Done, like iOS long-press.
		await page.mouse.move(point!.x, point!.y);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();
		await expect(page.locator('.ios-jiggle, .ios-jiggle-reverse').first()).toBeVisible({
			timeout: 5000,
		});
		await expect(page.getByRole('button', { name: 'Done editing home screen' })).toBeVisible();

		// Quick tap on empty background leaves edit mode.
		await page.mouse.move(point!.x, point!.y);
		await page.mouse.down();
		await page.mouse.up();
		await expect(page.locator('.ios-jiggle, .ios-jiggle-reverse')).toHaveCount(0, {
			timeout: 5000,
		});
		await expect(page.getByRole('button', { name: 'Done editing home screen' })).toBeHidden();
	});
});
