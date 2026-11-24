import { test, expect, type Page } from '@playwright/test';

async function bootDesktop(page: Page) {
	await page.goto('/');
	await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
}

async function openMessages(page: Page) {
	await page.getByRole('button', { name: 'Launch Messages' }).click();
	const app = page.locator('.messages-app');
	await expect(app).toBeVisible({ timeout: 10000 });
	return app;
}

async function openPhone(page: Page) {
	await page.locator('[aria-label="Open Phone"]').dblclick();
	const app = page.locator('.phone-app');
	await expect(app).toBeVisible({ timeout: 10000 });
	return app;
}

test.describe('communications apps (Messages & Phone)', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('Messages: filter, send, Escape back, compose new thread, and persist across reload', async ({
		page,
	}) => {
		await bootDesktop(page);
		const messages = await openMessages(page);

		await expect(messages.getByRole('heading', { name: 'Messages' })).toBeVisible();
		await expect(messages.getByRole('button', { name: 'Ilham, unread' })).toBeVisible();

		// Search filters conversation list and clears cleanly.
		const search = messages.getByLabel('Search conversations');
		await search.fill('Kurir');
		await expect(messages.getByRole('button', { name: 'Kurir Paket' })).toBeVisible();
		await expect(messages.getByRole('button', { name: 'Ilham, unread' })).toBeHidden();
		await messages.getByRole('button', { name: 'Clear search' }).click();
		await expect(messages.getByRole('button', { name: 'Ilham, unread' })).toBeVisible();

		// Open existing thread and send a new message.
		await messages.getByRole('button', { name: 'Ilham, unread' }).click();
		await expect(messages.getByText('Jadi. Jam 4 ya')).toBeVisible();

		const messageInput = messages.getByLabel('Message text');
		await messageInput.fill('On my way soon!');
		await messages.getByRole('button', { name: 'Send message' }).click();
		await expect(messages.getByText('On my way soon!')).toBeVisible();

		// Escape from inside the app returns to the conversation list and marks thread read.
		await messageInput.focus();
		await messageInput.press('Escape');
		await expect(messages.getByRole('heading', { name: 'Messages' })).toBeVisible();
		await expect(messages.getByRole('button', { name: 'Ilham', exact: true })).toBeVisible();

		// Compose a brand new conversation.
		await messages.getByRole('button', { name: 'New message' }).click();
		await expect(messages.getByText('New Message')).toBeVisible();
		await messages.getByLabel('Recipient').fill('Budi');
		await messages.getByLabel('Message text').fill('Hello from Playwright');
		await messages.getByRole('button', { name: 'Send message' }).click();
		await expect(messages.getByText('Hello from Playwright')).toBeVisible();
		await expect(messages.getByRole('button', { name: 'Call Budi' })).toBeVisible();

		// Reload and confirm both sent messages persisted in storage.
		await page.reload();
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		const reloaded = await openMessages(page);

		await expect(reloaded.getByRole('button', { name: 'Budi', exact: true })).toBeVisible();
		await reloaded.getByRole('button', { name: 'Ilham', exact: true }).click();
		await expect(reloaded.getByText('On my way soon!')).toBeVisible();

		await reloaded.getByRole('button', { name: 'Back to messages' }).click();
		await reloaded.getByRole('button', { name: 'Budi', exact: true }).click();
		await expect(reloaded.getByText('Hello from Playwright')).toBeVisible();
	});

	test('Phone: dial, call lifecycle, recents log, favorites, tabs, and persist across reload', async ({
		page,
	}) => {
		await bootDesktop(page);
		const phone = await openPhone(page);

		// Dial 5551234 on Keypad.
		const dialSequence = ['5 JKL', '5 JKL', '5 JKL', '1', '2 ABC', '3 DEF', '4 GHI'];
		for (const label of dialSequence) {
			await phone.getByRole('button', { name: label, exact: true }).click();
		}
		await expect(phone.locator('[aria-live="polite"]').first()).toHaveText('5551234');

		// Start call, verify Active Call overlay, then end call.
		await phone.getByRole('button', { name: 'Call 5551234' }).click();
		const callDialog = phone.getByRole('dialog', { name: 'Calling 5551234' });
		await expect(callDialog).toBeVisible();
		await expect(callDialog.getByText('iLmi Mobile')).toBeVisible();
		await callDialog.getByRole('button', { name: 'End call' }).click();
		await expect(callDialog).toBeHidden();

		// Recents tab logs the dialed number.
		const recentsTab = phone.getByRole('tab', { name: 'Recents' });
		await recentsTab.click();
		await expect(recentsTab).toHaveAttribute('aria-selected', 'true');
		await expect(phone.getByRole('heading', { name: 'Recents' })).toBeVisible();
		await expect(phone.getByRole('button', { name: 'Call back 5551234' })).toBeVisible();

		// Add a favorite from Keypad, then verify and remove it in Favorites.
		await phone.getByRole('tab', { name: 'Keypad' }).click();
		for (const label of ['8 TUV', '0 plus', '8 TUV']) {
			await phone.getByRole('button', { name: label, exact: true }).click();
		}
		await phone.getByRole('button', { name: 'Add number to favorites' }).click();

		const favoritesTab = phone.getByRole('tab', { name: 'Favorites' });
		await favoritesTab.click();
		await expect(favoritesTab).toHaveAttribute('aria-selected', 'true');
		await expect(phone.getByRole('button', { name: 'Call 808' })).toBeVisible();
		await phone.getByRole('button', { name: 'Remove 808 from favorites' }).click();
		await expect(phone.getByText('No Favorites')).toBeVisible();

		// Contacts derives from call history and Voicemail renders its empty state.
		await phone.getByRole('tab', { name: 'Contacts' }).click();
		await expect(phone.getByRole('heading', { name: 'Contacts' })).toBeVisible();
		await expect(phone.getByRole('button', { name: 'Call 5551234' })).toBeVisible();
		await phone.getByLabel('Search contacts').fill('999');
		await expect(phone.getByText('No Contacts')).toBeVisible();
		await phone.getByLabel('Search contacts').fill('');

		await phone.getByRole('tab', { name: 'Voicemail' }).click();
		await expect(phone.getByRole('heading', { name: 'Voicemail' })).toBeVisible();
		await expect(phone.getByText('No Voicemails')).toBeVisible();

		// Reload and confirm call log persisted.
		await page.reload();
		await expect(page.locator('.macos-menubar')).toBeVisible({ timeout: 20000 });
		const reloaded = await openPhone(page);
		await reloaded.getByRole('tab', { name: 'Recents' }).click();
		await expect(reloaded.getByRole('button', { name: 'Call back 5551234' })).toBeVisible();
	});
});
