import { test, expect, type Page } from '@playwright/test';

async function bootDesktop(page: Page) {
	await page.goto('/');
	await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
}

async function openSafari(page: Page) {
	await page.getByRole('button', { name: 'Launch Safari' }).click();
	const app = page.locator('.safari-app');
	await expect(app).toBeVisible({ timeout: 10000 });
	return app;
}

async function openMusic(page: Page) {
	await page.getByRole('button', { name: 'Launch Music' }).click();
	const app = page.locator('.music-app');
	await expect(app).toBeVisible({ timeout: 10000 });
	return app;
}

test.describe('media & browsing apps (Safari & Music)', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('Safari: start page, URL navigation, back/forward, bookmark, tab overview, and reload', async ({
		page,
	}) => {
		// Stub external HTTPS iframe requests so tests never hit the public network.
		await page.route('https://**/*', route =>
			route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: '<!doctype html><title>Offline Stub</title><p>Stubbed page</p>',
			})
		);

		await bootDesktop(page);
		const safari = await openSafari(page);

		// Start Page shows default Favorites and disabled navigation controls.
		await expect(safari.getByRole('heading', { name: 'Start Page' })).toBeVisible();
		await expect(safari.getByRole('button', { name: 'Open apple.com' })).toBeVisible();
		await expect(safari.getByRole('button', { name: 'Open github.com' })).toBeVisible();
		await expect(safari.getByRole('button', { name: 'Go back' })).toBeDisabled();

		// Submit a bare hostname via the address bar -> normalized to https://example.com.
		await safari.getByRole('button', { name: 'Search or enter website' }).click();
		const addressInput = safari.getByLabel('Address');
		await addressInput.fill('example.com');
		await addressInput.press('Enter');

		const addressBtn = safari.getByRole('button', {
			name: 'Address: https://example.com. Tap to edit.',
		});
		await expect(addressBtn).toBeVisible();
		await expect(addressBtn).toHaveText('example.com');
		await expect(safari.locator('iframe[title="Browser"]')).toHaveAttribute(
			'src',
			'https://example.com'
		);

		// Navigate to a second URL so Back history becomes available.
		await addressBtn.click();
		await safari.getByLabel('Address').fill('iana.org');
		await safari.getByLabel('Address').press('Enter');
		await expect(
			safari.getByRole('button', { name: 'Address: https://iana.org. Tap to edit.' })
		).toBeVisible();

		const backBtn = safari.getByRole('button', { name: 'Go back' });
		const forwardBtn = safari.getByRole('button', { name: 'Go forward' });
		await expect(backBtn).toBeEnabled();
		await backBtn.click();
		await expect(addressBtn).toBeVisible();
		await expect(forwardBtn).toBeEnabled();

		// Bookmark current URL (https://example.com).
		await safari.getByRole('button', { name: 'Add bookmark' }).click();
		const removeBookmarkBtn = safari.getByRole('button', { name: 'Remove bookmark' });
		await expect(removeBookmarkBtn).toHaveAttribute('aria-pressed', 'true');

		// Tab Overview: create a second tab, switch back, then close the extra tab.
		await safari.getByRole('button', { name: 'Show 1 tabs' }).click();
		await expect(safari.getByRole('heading', { name: '1 Tabs' })).toBeVisible();
		await safari.getByRole('button', { name: 'New tab' }).click();

		await expect(safari.getByRole('heading', { name: 'Start Page' })).toBeVisible();
		await expect(safari.getByRole('button', { name: 'Open example.com' })).toBeVisible();
		await expect(safari.getByRole('button', { name: 'Show 2 tabs' })).toBeVisible();

		await safari.getByRole('button', { name: 'Show 2 tabs' }).click();
		await expect(safari.getByRole('heading', { name: '2 Tabs' })).toBeVisible();
		await safari.getByRole('button', { name: 'Open example.com' }).click();
		await expect(addressBtn).toBeVisible();

		await safari.getByRole('button', { name: 'Show 2 tabs' }).click();
		await safari.getByRole('button', { name: 'Close tab' }).click();
		await expect(safari.getByRole('heading', { name: '1 Tabs' })).toBeVisible();
		await safari.getByRole('button', { name: 'Done viewing tabs' }).click();

		// Reload and confirm bookmarked Favorite persists on Start Page.
		await page.reload();
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		const reloaded = await openSafari(page);
		await expect(reloaded.getByRole('button', { name: 'Open example.com' })).toBeVisible();
	});

	test('Music: play track, mini player, Now Playing modal, like, search, and persist across reload', async ({
		page,
	}) => {
		await bootDesktop(page);
		const music = await openMusic(page);

		await expect(music.getByRole('heading', { name: 'Library' })).toBeVisible();

		// Play first track and verify MiniPlayer controls appear.
		await music.getByRole('button', { name: 'Play Glasswing by Pagi Drive' }).click();
		const miniPlayerTrigger = music.getByRole('button', {
			name: 'Open now playing: Glasswing',
		});
		await expect(miniPlayerTrigger).toBeVisible({ timeout: 10000 });
		await expect(music.getByRole('button', { name: 'Pause' })).toBeVisible();
		await expect(music.getByRole('button', { name: 'Next track' })).toBeVisible();

		// Open full Now Playing modal, toggle Like, then close modal.
		await miniPlayerTrigger.click();
		const closePlayerBtn = music.getByRole('button', { name: 'Close player' });
		await expect(closePlayerBtn).toBeVisible();

		const nowPlaying = closePlayerBtn.locator('../..');
		await expect(nowPlaying.getByText('Pagi Drive — Demo Mix')).toBeVisible();
		await nowPlaying.getByRole('button', { name: 'Like Glasswing' }).click();
		await expect(nowPlaying.getByRole('button', { name: 'Unlike Glasswing' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await closePlayerBtn.click();
		await expect(closePlayerBtn).toBeHidden();
		await expect(music.getByRole('button', { name: 'Unlike Glasswing' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		// Switch to Search tab and filter tracks by artist.
		const searchTab = music.getByRole('tab', { name: 'Search' });
		await searchTab.click();
		await expect(searchTab).toHaveAttribute('aria-selected', 'true');
		await expect(music.getByRole('heading', { name: 'Search' })).toBeVisible();

		const searchInput = music.getByLabel('Search songs');
		await searchInput.fill('Mahakam');
		await expect(
			music.getByRole('button', { name: 'Play Amparan by Mahakam Drift' })
		).toBeVisible();
		await expect(
			music.getByRole('button', { name: 'Play Hujan Batu by Mahakam Drift' })
		).toBeVisible();
		await expect(music.getByRole('button', { name: 'Play Glasswing by Pagi Drive' })).toBeHidden();

		await searchInput.fill('no-such-track');
		await expect(music.getByText('No Results')).toBeVisible();
		await music.getByRole('button', { name: 'Clear search' }).click();
		await expect(music.getByRole('button', { name: 'Play Glasswing by Pagi Drive' })).toBeVisible();

		// Reload and confirm liked track persisted.
		await page.reload();
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		const reloaded = await openMusic(page);
		await expect(reloaded.getByRole('button', { name: 'Unlike Glasswing' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
});
