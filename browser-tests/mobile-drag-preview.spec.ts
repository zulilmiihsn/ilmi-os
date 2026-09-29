import { test, expect, type Locator, type Page } from '@playwright/test';

async function rectOf(icon: Locator) {
	const rect = await icon.boundingBox();
	if (!rect) throw new Error('Expected a visible home screen icon');
	return rect;
}

function orderOf(icons: Locator) {
	return icons.evaluateAll(els => els.map(el => el.getAttribute('data-app-id')));
}

function sampleXs(icon: Locator, duration: number) {
	return icon.evaluate(
		(el, ms) =>
			new Promise<number[]>(resolve => {
				const xs: number[] = [];
				const start = performance.now();
				const tick = () => {
					xs.push(el.getBoundingClientRect().x);
					if (performance.now() - start < ms) requestAnimationFrame(tick);
					else resolve(xs);
				};
				requestAnimationFrame(tick);
			}),
		duration
	);
}

async function expectSettledGrid(page: Page) {
	await expect
		.poll(() =>
			page
				.locator('.ios-app-grid-page')
				.first()
				.evaluate(el => {
					const expected =
						6 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
					return Math.abs(el.getBoundingClientRect().top - expected);
				})
		)
		.toBeLessThan(1);
}

test.describe('mobile drag preview', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

	for (const input of ['mouse', 'touch'] as const) {
		for (const alreadyEditing of [false, true]) {
			const scenario = alreadyEditing
				? 'in edit mode and cancel restores'
				: 'from normal mode and drop commits';
			test(`${input}: neighbours move while held ${scenario}`, async ({ page }) => {
				await page.goto('/');
				await expect(page.locator('.ios-homescreen')).toBeVisible();
				const icons = page.locator('.ios-app-grid-page').first().locator('[data-app-id]');
				const before = await orderOf(icons);
				// Track identities, not DOM indices that change when sorting commits.
				const [activeId, neighbourId, targetId] = before.slice(4, 7);
				if (!activeId || !neighbourId || !targetId) throw new Error('Missing drag fixture icons');
				const grid = page.locator('.ios-app-grid-page').first();
				const active = grid.locator(`[data-app-id="${activeId}"]`);
				const neighbour = grid.locator(`[data-app-id="${neighbourId}"]`);
				const target = grid.locator(`[data-app-id="${targetId}"]`);
				if (alreadyEditing) {
					await page.mouse.move(80, 150);
					await page.mouse.down();
					await expect(
						page.getByRole('button', { name: 'Done editing home screen' })
					).toBeVisible();
					await page.mouse.up();
					await expectSettledGrid(page);
				}
				const cdp = input === 'touch' ? await page.context().newCDPSession(page) : null;
				const from = await rectOf(active);
				if (cdp) {
					await cdp.send('Input.dispatchTouchEvent', {
						type: 'touchStart',
						touchPoints: [{ x: from.x + 10, y: from.y + 10, id: 1 }],
					});
				} else {
					await page.mouse.move(from.x + 10, from.y + 10);
					await page.mouse.down();
					await page.mouse.move(from.x + 16, from.y + 10);
				}
				await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
				await expectSettledGrid(page);
				const neighbourBefore = await rectOf(neighbour);
				const to = await rectOf(target);
				const sampling = sampleXs(neighbour, 650);
				// Even at the centre of the insertion gap, a held drag is a reorder.
				const x = to.x + to.width / 2;
				const y = to.y + to.height / 2;
				if (cdp) {
					await cdp.send('Input.dispatchTouchEvent', {
						type: 'touchMove',
						touchPoints: [{ x, y, id: 1 }],
					});
				} else {
					await page.mouse.move(x, y, { steps: 8 });
				}
				const xs = await sampling;
				const during = await rectOf(neighbour);
				// Assert before release; stationary neighbours must fail the test.
				expect(neighbourBefore.x - during.x).toBeGreaterThan(60);
				expect(Math.abs(during.x - from.x)).toBeLessThan(5);
				expect(
					xs.filter(value => value < neighbourBefore.x - 10 && value > during.x + 10).length
				).toBeGreaterThan(1);
				expect(await orderOf(icons)).toEqual(before);
				const settling = sampleXs(neighbour, 450);
				if (alreadyEditing) await page.keyboard.press('Escape');
				if (cdp) {
					await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
					await cdp.detach();
				} else {
					await page.mouse.up();
				}
				const expectedOrder = [...before];
				if (!alreadyEditing) {
					expectedOrder.splice(4, 1);
					expectedOrder.splice(6, 0, activeId);
				}
				await expect.poll(() => orderOf(icons)).toEqual(expectedOrder);
				await expect
					.poll(async () =>
						Math.abs((await rectOf(neighbour)).x - (alreadyEditing ? neighbourBefore.x : during.x))
					)
					.toBeLessThan(5);
				const settledXs = await settling;
				if (!alreadyEditing) {
					expect(Math.max(...settledXs.map(value => Math.abs(value - during.x)))).toBeLessThan(5);
					expect(Math.abs((await rectOf(active)).x - to.x)).toBeLessThan(5);
				}
				expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
			});
		}
	}

	for (const area of ['grid', 'dock'] as const) {
		test(`centre drop after prolonged preview reorders in ${area}`, async ({ page }) => {
			await page.goto('/');
			await expect(page.locator('.ios-homescreen')).toBeVisible();
			const container = page.locator(area === 'grid' ? '.ios-app-grid-page' : '.ios-dock').first();
			const icons = container.locator('[data-app-id]');
			const before = await orderOf(icons);
			const [activeId, neighbourId, targetId] = before;
			if (!activeId || !neighbourId || !targetId) throw new Error('Missing drag fixture icons');
			const active = container.locator(`[data-app-id="${activeId}"]`);
			const neighbour = container.locator(`[data-app-id="${neighbourId}"]`);
			const target = container.locator(`[data-app-id="${targetId}"]`);
			const from = await rectOf(active);
			await page.mouse.move(from.x + 10, from.y + 10);
			await page.mouse.down();
			await page.mouse.move(from.x + 16, from.y + 10);
			await expect(page.getByRole('button', { name: 'Done editing home screen' })).toBeVisible();
			await expectSettledGrid(page);
			const neighbourBefore = await rectOf(neighbour);
			const to = await rectOf(target);
			await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
			await expect
				.poll(async () => neighbourBefore.x - (await rectOf(neighbour)).x)
				.toBeGreaterThan(60);
			await page.waitForTimeout(900);
			expect(Math.abs((await rectOf(neighbour)).x - from.x)).toBeLessThan(5);
			await page.mouse.up();
			const expectedOrder = [...before];
			expectedOrder.splice(0, 1);
			expectedOrder.splice(2, 0, activeId);
			await expect.poll(() => orderOf(icons)).toEqual(expectedOrder);
			expect(new Set(await orderOf(icons)).size).toBe(before.length);
			await expect(page.locator('[data-folder-id]')).toHaveCount(0);
			await expect(page.getByText(/Release to (create|add to) folder/)).toHaveCount(0);
		});
	}
});
