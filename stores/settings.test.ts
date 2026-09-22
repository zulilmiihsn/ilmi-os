import { describe, it, expect } from 'vitest';
import { DEFAULT_WALLPAPER, migrateWallpaper } from './settings';

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
