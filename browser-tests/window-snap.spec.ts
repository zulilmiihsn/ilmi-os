import { test, expect, type Page, type Locator } from '@playwright/test';

async function dragHeaderTo(page: Page, header: Locator, targetX: number, targetY: number) {
	const box = await header.boundingBox();
	expect(box).not.toBeNull();
	if (!box) return;
	const startX = box.x + box.width / 2;
	const startY = box.y + box.height / 2;
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(targetX, targetY, { steps: 12 });
}

test.describe('window snapping', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('drags Finder to left edge and snaps to left half', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.waitForTimeout(600);

		const finderHeader = page.locator('.window-header', { hasText: 'Finder' });
		const finderWindow = finderHeader.locator('..');

		await dragHeaderTo(page, finderHeader, 8, 300);
		await expect(page.locator('.snap-preview[data-snap-zone="left"]')).toBeVisible({
			timeout: 3000,
		});
		await page.mouse.up();
		await expect(page.locator('.snap-preview')).toHaveCount(0, { timeout: 3000 });
		await page.waitForTimeout(400);

		const box = await finderWindow.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.x).toBeLessThan(20);
			expect(box.y).toBeGreaterThanOrEqual(28);
			expect(box.width).toBeGreaterThan(680);
			expect(box.width).toBeLessThan(740);
		}
	});

	test('tiles Finder left and Notes right without overlap', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.waitForTimeout(600);

		const finderHeader = page.locator('.window-header', { hasText: 'Finder' });
		const finderWindow = finderHeader.locator('..');

		await dragHeaderTo(page, finderHeader, 8, 300);
		await expect(page.locator('.snap-preview[data-snap-zone="left"]')).toBeVisible({
			timeout: 3000,
		});
		await page.mouse.up();
		await page.waitForTimeout(400);

		await page.getByRole('button', { name: 'Launch Notes' }).click();
		await expect(page.locator('.notes-app')).toBeVisible({ timeout: 10000 });
		await page.waitForTimeout(600);

		const notesHeader = page.locator('.window-header', { hasText: 'Notes' });
		const notesWindow = notesHeader.locator('..');

		await dragHeaderTo(page, notesHeader, 1432, 300);
		await expect(page.locator('.snap-preview[data-snap-zone="right"]')).toBeVisible({
			timeout: 3000,
		});
		await page.mouse.up();
		await expect(page.locator('.snap-preview')).toHaveCount(0, { timeout: 3000 });
		await page.waitForTimeout(400);

		const finderBox = await finderWindow.boundingBox();
		const notesBox = await notesWindow.boundingBox();
		expect(finderBox).not.toBeNull();
		expect(notesBox).not.toBeNull();
		if (finderBox && notesBox) {
			expect(notesBox.x).toBeGreaterThan(700);
			expect(finderBox.x + finderBox.width).toBeLessThanOrEqual(notesBox.x);
		}
	});

	test('drags Finder to top edge and maximizes window', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		await page.getByRole('button', { name: 'Launch Finder' }).click();
		await expect(page.locator('.finder')).toBeVisible({ timeout: 10000 });
		await page.waitForTimeout(600);

		const finderHeader = page.locator('.window-header', { hasText: 'Finder' });
		const finderWindow = finderHeader.locator('..');

		await dragHeaderTo(page, finderHeader, 720, 12);
		await expect(page.locator('.snap-preview[data-snap-zone="top"]')).toBeVisible({
			timeout: 3000,
		});
		await page.mouse.up();
		await expect(page.locator('.snap-preview')).toHaveCount(0, { timeout: 3000 });
		await page.waitForTimeout(400);

		const box = await finderWindow.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.width).toBeGreaterThanOrEqual(1400);
		}
	});
});
