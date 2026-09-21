import { test, expect } from '@playwright/test';

// Desktop shell: render + console errors + window focus/maximize behavior.
test.describe('desktop shell', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('boots to desktop without console errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', err => errors.push(err.message));
		await page.goto('/');
		// Boot screen gives way to the desktop shell.
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		expect(errors).toEqual([]);
	});

	test('clicking an inactive window body focuses it', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		// Open two apps via desktop icons (double-click launches).
		const calc = page.locator('[aria-label="Open Calculator"]');
		const clock = page.locator('[aria-label="Open Clock"]');
		await calc.dblclick();
		await clock.dblclick();
		const windows = page.locator('.window-content');
		await expect(windows).toHaveCount(2);
		// Drag the top window aside so the first window's body is exposed.
		// Split into steps: the app attaches move/up listeners on re-render.
		await page.evaluate(() => {
			const header = document.querySelectorAll('.window-header')[1] as HTMLElement;
			const r = header.getBoundingClientRect();
			(header as unknown as { __dragFrom: number[] }).__dragFrom = [r.left + 200, r.top + 18];
			header.dispatchEvent(
				new MouseEvent('mousedown', {
					bubbles: true,
					cancelable: true,
					clientX: r.left + 200,
					clientY: r.top + 18,
					buttons: 1,
				})
			);
		});
		await page.waitForTimeout(500);
		await page.evaluate(() => {
			const header = document.querySelectorAll('.window-header')[1] as HTMLElement;
			const [x, y] = (header as unknown as { __dragFrom: number[] }).__dragFrom;
			const opts = (cx: number, cy: number): MouseEventInit => ({
				bubbles: true,
				cancelable: true,
				clientX: cx,
				clientY: cy,
				buttons: 1,
			});
			window.dispatchEvent(new MouseEvent('mousemove', opts(x + 300, y + 130)));
			window.dispatchEvent(new MouseEvent('mouseup', opts(x + 300, y + 130)));
		});
		// Click the first window's body: it must become the focused one.
		// force: the inactive window's own transparent overlay sits on top by
		// design; the click must still bubble to the window root handler.
		await windows.first().click({ position: { x: 30, y: 60 }, force: true });
		await expect
			.poll(async () =>
				page.evaluate(() => {
					const contents = Array.from(document.querySelectorAll('.window-content'));
					return contents.map(el => !el.classList.contains('pointer-events-none'));
				})
			)
			.toEqual([true, false]);
	});

	test('double-clicking app content does not maximize the window', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.locator('[aria-label="Open Terminal"]').dblclick();
		const win = page.locator('.window-content').first();
		await expect(win).toBeVisible();
		const before = await page.evaluate(() =>
			document.body.innerHTML.includes('translate3d(0, 0, 0)')
		);
		await win.dblclick({ position: { x: 30, y: 30 } });
		// Still not maximized: transform must not snap to fullscreen origin.
		const after = await page.evaluate(() =>
			document.body.innerHTML.includes('translate3d(0, 0, 0)')
		);
		expect(after).toBe(before);
	});
});
