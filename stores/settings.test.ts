import { describe, it, expect, beforeEach } from 'vitest';
import {
	DEFAULT_WALLPAPER,
	migrateSettingsState,
	migrateWallpaper,
	useSettingsStore,
} from './settings';

describe('settings wallpaper migration', () => {
	it('maps removed assets to their replacements', () => {
		expect(migrateWallpaper('/media/Wallpaper-desktop-1.jpg')).toBe(
			'/media/Wallpaper-desktop-1.webp'
		);
		expect(migrateWallpaper('/media/Wallpaper-1.png')).toBe('/media/Wallpaper-1.webp');
	});

	it('keeps current values and falls back safely', () => {
		expect(migrateWallpaper(DEFAULT_WALLPAPER)).toBe(DEFAULT_WALLPAPER);
		expect(migrateWallpaper('linear-gradient(to right, #ff7e5f, #feb47b)')).toBe(
			'linear-gradient(to right, #ff7e5f, #feb47b)'
		);
		expect(migrateWallpaper(null)).toBe(DEFAULT_WALLPAPER);
		expect(migrateWallpaper(undefined)).toBe(DEFAULT_WALLPAPER);
	});
});

describe('settings store actions', () => {
	beforeEach(() => {
		const storage = new Map<string, string>();
		globalThis.localStorage = {
			getItem: (key: string) => storage.get(key) || null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
			clear: () => storage.clear(),
			key: (index: number) => Array.from(storage.keys())[index] || null,
			length: storage.size,
		} as unknown as Storage;
		(globalThis as unknown as { window: unknown }).window = globalThis;
		useSettingsStore.setState({ wallpaper: DEFAULT_WALLPAPER, darkMode: false });
	});

	it('updates wallpaper and dark mode explicitly', () => {
		useSettingsStore.getState().setWallpaper('/media/custom.webp');
		expect(useSettingsStore.getState().wallpaper).toBe('/media/custom.webp');
		useSettingsStore.getState().setDarkMode(true);
		expect(useSettingsStore.getState().darkMode).toBe(true);
		useSettingsStore.getState().toggleDarkMode();
		expect(useSettingsStore.getState().darkMode).toBe(false);
	});

	it('migrates legacy persisted settings snapshots', () => {
		expect(
			migrateSettingsState({ wallpaper: '/media/Wallpaper-1.png', darkMode: 'yes' })
		).toMatchObject({ wallpaper: '/media/Wallpaper-1.webp', darkMode: false });
		expect(migrateSettingsState({ wallpaper: '/media/custom.webp', darkMode: true })).toMatchObject(
			{ wallpaper: '/media/custom.webp', darkMode: true }
		);
	});
});
