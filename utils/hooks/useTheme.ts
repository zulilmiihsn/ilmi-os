import { useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings';

/**
 * Theme tokens for consistent styling across components.
 * All values are Tailwind CSS class names or raw values.
 */
export interface ThemeTokens {
    // Background colors
    bg: string;
    bgSecondary: string;
    bgTertiary: string;

    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Border colors
    border: string;
    borderSecondary: string;

    // Header/Navigation
    headerBg: string;
    headerBorder: string;

    // Input fields
    inputBg: string;
    inputText: string;
    inputPlaceholder: string;

    // Active/Interactive states
    activeItem: string;
    hoverItem: string;

    // Modal/Dialog
    modalBg: string;
    modalOverlay: string;

    // Accent colors (always same regardless of theme)
    accent: string;
    accentHover: string;
    danger: string;
    success: string;
    warning: string;

    // Misc
    homeIndicator: string;
    separator: string;

    // Raw values for inline styles
    isDarkMode: boolean;
}

/**
 * Custom hook for centralized theme management.
 * Provides consistent theme tokens based on dark mode setting.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useTheme();
 *
 *   return (
 *     <div className={`${theme.bg} ${theme.text}`}>
 *       <h1 className={theme.text}>Hello</h1>
 *       <p className={theme.textSecondary}>Subtitle</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeTokens {
    const darkMode = useSettingsStore(state => state.darkMode);

    return useMemo(
        (): ThemeTokens => ({
            // Background colors
            bg: darkMode ? 'bg-black' : 'bg-white',
            bgSecondary: darkMode ? 'bg-[#1C1C1E]' : 'bg-gray-100',
            bgTertiary: darkMode ? 'bg-gray-900' : 'bg-gray-50',

            // Text colors
            text: darkMode ? 'text-white' : 'text-black',
            textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
            textMuted: darkMode ? 'text-gray-500' : 'text-gray-400',
            textInverse: darkMode ? 'text-black' : 'text-white',

            // Border colors
            border: darkMode ? 'border-gray-800' : 'border-gray-200',
            borderSecondary: darkMode ? 'border-gray-700' : 'border-gray-300',

            // Header/Navigation
            headerBg: darkMode ? 'bg-black/95' : 'bg-white/95',
            headerBorder: darkMode ? 'border-gray-800' : 'border-gray-200',

            // Input fields
            inputBg: darkMode ? 'bg-gray-900' : 'bg-gray-100',
            inputText: darkMode ? 'text-white' : 'text-black',
            inputPlaceholder: darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400',

            // Active/Interactive states
            activeItem: darkMode ? 'active:bg-gray-900' : 'active:bg-gray-100',
            hoverItem: darkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-100',

            // Modal/Dialog
            modalBg: darkMode ? 'bg-[#1C1C1E]/90' : 'bg-white/90',
            modalOverlay: 'bg-black/30',

            // Accent colors (consistent across themes)
            accent: 'text-blue-500',
            accentHover: 'hover:text-blue-400',
            danger: 'text-red-500',
            success: 'text-green-500',
            warning: 'text-yellow-500',

            // Misc
            homeIndicator: darkMode ? 'bg-gray-500/80' : 'bg-black/80',
            separator: darkMode ? 'bg-gray-800' : 'bg-gray-200',

            // Raw values
            isDarkMode: darkMode,
        }),
        [darkMode]
    );
}
