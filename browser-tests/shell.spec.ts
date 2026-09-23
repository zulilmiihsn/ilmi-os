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
			const [x = 0, y = 0] = (header as unknown as { __dragFrom: number[] }).__dragFrom;
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

	test('control center opens as dark frosted glass with blue active tiles', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Control Center' }).click();
		const panel = page.locator('.control-center');
		await expect(panel).toBeVisible({ timeout: 5000 });

		const frame = await page.evaluate(() => {
			const el = document.querySelector('.control-center');
			if (!el) return null;
			const style = getComputedStyle(el);
			return {
				bg: style.backgroundColor,
				backdrop: style.backdropFilter,
			};
		});
		expect(frame).not.toBeNull();
		// Always-dark glass (content is white-only): translucent black + blur.
		// (Edge may serialize as rgba() or oklab(); both describe the same color.)
		expect(frame!.bg).toMatch(/0[,\s] *0[,\s] *0/);
		expect(frame!.bg).toContain('0.3');
		expect(frame!.backdrop).toContain('blur');

		// Wi-Fi starts on: its tile renders iOS blue like macOS toggles.
		// Plain (unmodified) colors serialize as rgb(); only color-mix() with
		// opacity modifiers resolves to oklab, so this is deterministic.
		const wifiTile = await page.evaluate(() => {
			const btn = document.querySelector('.control-center button[aria-label^="Wi-Fi"]');
			return btn ? getComputedStyle(btn).backgroundColor : 'missing';
		});
		expect(wifiTile).toBe('rgb(0, 122, 255)');
	});

	test('menubar menus fade in instead of popping', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Apple menu' }).click();
		// The Apple menu dropdown animates open like macOS menus.
		const menu = page.getByRole('menu').first();
		await expect(menu).toBeVisible({ timeout: 5000 });
		// zoomIn95 carries the fade (opacity 0→1) plus the scale; later
		// keyframe rules win over .fade-in, so either name proves motion.
		const animationName = await menu.evaluate(el => getComputedStyle(el).animationName);
		expect(animationName).toMatch(/fadeIn|zoomIn/);
	});

	test('control center tiles give feedback and toggle', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Control Center' }).click();
		const wifi = page.locator('.control-center button[aria-label^="Wi-Fi"]');
		await expect(wifi).toBeVisible({ timeout: 5000 });

		// Hover feedback (macOS highlight cue).
		await wifi.hover();
		const hoverFilter = await wifi.evaluate(el => getComputedStyle(el).filter);
		expect(hoverFilter).toContain('brightness');

		// Toggle off and back on; the tile color follows the state.
		const bgOf = () => wifi.evaluate(el => getComputedStyle(el).backgroundColor);
		await wifi.click();
		await expect.poll(bgOf, { timeout: 3000 }).not.toBe('rgb(0, 122, 255)');
		await wifi.click();
		await expect.poll(bgOf, { timeout: 3000 }).toBe('rgb(0, 122, 255)');

		// Every tile is alive: AirDrop (ex-User Profile dead button) toggles too.
		const airdrop = page.locator('.control-center button[aria-label^="AirDrop"]');
		await airdrop.click();
		await expect(airdrop).toHaveAttribute('aria-label', 'AirDrop Off');
		await airdrop.click();
		await expect(airdrop).toHaveAttribute('aria-label', 'AirDrop On');
	});

	test('dock shows app names on hover and bounces icons on launch', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		const finderIcon = page.locator('.dock-item[data-app-id="finder"]');
		await finderIcon.hover();
		// Name tooltip fades in after a beat, like macOS (opacity-based:
		// Playwright visibility ignores opacity, so assert computed opacity).
		const tooltip = finderIcon.locator('.dock-tooltip');
		await expect(tooltip).toHaveText('Finder');
		await expect
			.poll(async () => tooltip.evaluate(el => Number(getComputedStyle(el).opacity)), {
				timeout: 4000,
			})
			.toBeGreaterThan(0.5);
		// Clicking launches with a bounce cue on the icon itself.
		await finderIcon.click();
		const bounce = await finderIcon.evaluate(el => getComputedStyle(el).animationName);
		expect(bounce).toContain('dockBounce');
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
	});
});
