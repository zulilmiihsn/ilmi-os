import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
	wallpaper: string;
	darkMode: boolean;
	notificationsEnabled: boolean;
	setWallpaper: (wallpaper: string) => void;
	toggleDarkMode: () => void;
	setDarkMode: (isDark: boolean) => void;
	setNotificationsEnabled: (enabled: boolean) => void;
}

export const DEFAULT_WALLPAPER = '/media/Wallpaper-desktop-1.webp';

/** True when a wallpaper value should render as an image rather than a CSS background gradient. */
export function isImageWallpaper(value: string): boolean {
	return value.startsWith('/') || value.startsWith('http') || value.startsWith('data:image/');
}

/** Map removed assets to their replacements so old persisted settings keep working. */
const RENAMED_WALLPAPERS: Record<string, string> = {
	'/media/Wallpaper-desktop-1.jpg': '/media/Wallpaper-desktop-1.webp',
	'/media/Wallpaper-1.png': '/media/Wallpaper-1.webp',
};

export function migrateWallpaper(value: unknown): string {
	if (typeof value !== 'string') return DEFAULT_WALLPAPER;
	return RENAMED_WALLPAPERS[value] ?? value;
}

/** Bring a persisted settings snapshot onto the current schema (v1). */
export function migrateSettingsState(persisted: unknown): SettingsState {
	const state = persisted as Partial<SettingsState>;
	return {
		...state,
		wallpaper: migrateWallpaper(state.wallpaper),
		darkMode: typeof state.darkMode === 'boolean' ? state.darkMode : false,
		notificationsEnabled:
			typeof state.notificationsEnabled === 'boolean' ? state.notificationsEnabled : true,
	} as SettingsState;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		set => ({
			wallpaper: DEFAULT_WALLPAPER,
			darkMode: false,
			notificationsEnabled: true,
			setWallpaper: wallpaper => set({ wallpaper }),
			toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
			setDarkMode: isDark => set({ darkMode: isDark }),
			setNotificationsEnabled: notificationsEnabled => set({ notificationsEnabled }),
		}),
		{
			name: 'settings-storage',
			version: 1,
			migrate: persisted => migrateSettingsState(persisted),
		}
	)
);
