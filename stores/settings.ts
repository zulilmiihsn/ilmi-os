import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
	wallpaper: string;
	darkMode: boolean;
	setWallpaper: (wallpaper: string) => void;
	toggleDarkMode: () => void;
	setDarkMode: (isDark: boolean) => void;
}

export const DEFAULT_WALLPAPER = '/media/Wallpaper-desktop-1.webp';

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
	} as SettingsState;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		set => ({
			wallpaper: DEFAULT_WALLPAPER,
			darkMode: false,
			setWallpaper: wallpaper => set({ wallpaper }),
			toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
			setDarkMode: isDark => set({ darkMode: isDark }),
		}),
		{
			name: 'settings-storage',
			version: 1,
			migrate: persisted => migrateSettingsState(persisted),
		},
	)
);
