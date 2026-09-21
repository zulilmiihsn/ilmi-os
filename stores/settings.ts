import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
	wallpaper: string;
	darkMode: boolean;
	setWallpaper: (wallpaper: string) => void;
	toggleDarkMode: () => void;
	setDarkMode: (isDark: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		set => ({
			wallpaper: '/media/Wallpaper-desktop-1.webp',
			darkMode: false,
			setWallpaper: wallpaper => set({ wallpaper }),
			toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
			setDarkMode: isDark => set({ darkMode: isDark }),
		}),
		{
			name: 'settings-storage',
		}
	)
);
