import type { WindowState } from '../../../types';
import { WINDOW } from '../../../constants';
import { useSettingsStore } from '../../../stores/settings';
import { createUniqueFolder } from '../../../utils/fileSystem';
import type { MenuItem } from '../MenuDropdown';

export interface MenuDefinition {
	label?: string;
	getItems: () => MenuItem[];
	bold?: boolean;
}

interface BuildMenusParams {
	activeAppName: string;
	activeWindow: WindowState | undefined;
	windows: WindowState[];
	openWindow: (
		window: Omit<WindowState, 'id' | 'zIndex' | 'isFocused'> & {
			originRect?: { x: number; y: number; width: number; height: number };
		}
	) => string;
	closeWindow: (id: string) => void;
	minimizeWindow: (id: string) => void;
	maximizeWindow: (id: string) => void;
	focusWindow: (id: string) => void;
	updateWindow: (id: string, updates: Partial<WindowState>) => void;
	onOpenSpotlight: () => void;
}

export function buildMenus({
	activeAppName,
	activeWindow,
	windows,
	openWindow,
	closeWindow,
	minimizeWindow,
	maximizeWindow,
	focusWindow,
	updateWindow,
	onOpenSpotlight,
}: BuildMenusParams): Record<string, MenuDefinition> {
	const openSettings = () =>
		window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'settings' }));

	const restoreAllWindows = () => {
		windows.forEach(w => {
			if (w.isMinimized) updateWindow(w.id, { isMinimized: false });
		});
		const last = windows[windows.length - 1];
		if (last) focusWindow(last.id);
	};

	const getAppleMenu = (): MenuItem[] => [
		{
			label: 'About This Mac',
			action: openSettings,
		},
		{ type: 'separator' },
		{
			label: 'System Preferences...',
			action: openSettings,
		},
		{ type: 'separator' },
		{
			label: activeWindow ? `Force Quit ${activeWindow.title}` : 'Force Quit...',
			shortcut: '⌥⌘Esc',
			disabled: !activeWindow,
			action: () => activeWindow && closeWindow(activeWindow.id),
		},
		{ type: 'separator' },
		{ label: 'Sleep', action: () => document.documentElement.classList.toggle('grayscale') },
		{ label: 'Restart...', action: () => window.location.reload() },
	];

	const getAppMenu = (): MenuItem[] => [
		{
			label: 'Preferences...',
			shortcut: '⌘,',
			action: openSettings,
		},
		{ type: 'separator' },
		{
			label: `Hide ${activeAppName}`,
			shortcut: '⌘H',
			disabled: !activeWindow,
			action: () => {
				if (activeWindow) minimizeWindow(activeWindow.id);
			},
		},
		{
			label: 'Show All',
			disabled: windows.length === 0,
			action: restoreAllWindows,
		},
		{ type: 'separator' },
		{
			label: `Quit ${activeAppName}`,
			shortcut: '⌘Q',
			disabled: !activeWindow,
			action: () => {
				if (activeWindow) closeWindow(activeWindow.id);
			},
		},
	];

	const getFileMenu = (): MenuItem[] => [
		{
			label: 'New Finder Window',
			shortcut: '⌘N',
			action: () =>
				openWindow({
					appId: 'finder',
					title: 'Finder',
					x: WINDOW.DEFAULT_X,
					y: WINDOW.DEFAULT_Y,
					width: WINDOW.DEFAULT_WIDTH,
					height: WINDOW.DEFAULT_HEIGHT,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{
			label: 'New Folder',
			shortcut: '⇧⌘N',
			action: () => {
				if (createUniqueFolder('Untitled Folder', 'folder-desktop')) {
					window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'finder' }));
				}
			},
		},
		{ type: 'separator' },
		{
			label: 'Close Window',
			shortcut: '⌘W',
			disabled: !activeWindow,
			action: () => activeWindow && closeWindow(activeWindow.id),
		},
	];

	const getEditMenu = (): MenuItem[] => [
		{
			label: 'Copy Selection',
			shortcut: '⌘C',
			action: () => {
				const text = window.getSelection()?.toString();
				if (text) navigator.clipboard?.writeText(text).catch(() => {});
			},
		},
		{
			label: 'Select All',
			shortcut: '⌘A',
			action: () => {
				const active = document.activeElement;
				if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
					active.select();
				}
			},
		},
	];

	const getViewMenu = (): MenuItem[] => [
		{
			label: useSettingsStore.getState().darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
			action: () => useSettingsStore.getState().toggleDarkMode(),
		},
		{ type: 'separator' },
		{
			label:
				typeof document !== 'undefined' && document.fullscreenElement
					? 'Exit Full Screen'
					: 'Enter Full Screen',
			shortcut: '⌃⌘F',
			action: () => {
				if (!document.fullscreenElement) {
					document.documentElement.requestFullscreen().catch(() => {});
				} else {
					document.exitFullscreen().catch(() => {});
				}
			},
		},
	];

	const getWindowMenu = (): MenuItem[] => [
		{
			label: 'Minimize',
			shortcut: '⌘M',
			disabled: !activeWindow,
			action: () => activeWindow && minimizeWindow(activeWindow.id),
		},
		{
			label: activeWindow?.isMaximized ? 'Restore Size' : 'Zoom',
			disabled: !activeWindow,
			action: () => activeWindow && maximizeWindow(activeWindow.id),
		},
		{ type: 'separator' },
		{
			label: 'Bring All to Front',
			disabled: windows.length === 0,
			action: restoreAllWindows,
		},
	];

	const getHelpMenu = (): MenuItem[] => [
		{
			label: 'Spotlight Search',
			action: onOpenSpotlight,
		},
		{
			label: 'Open Terminal',
			action: () =>
				window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'terminal' })),
		},
	];

	return {
		apple: { getItems: getAppleMenu },
		app: { label: activeAppName, getItems: getAppMenu, bold: true },
		file: { label: 'File', getItems: getFileMenu },
		edit: { label: 'Edit', getItems: getEditMenu },
		view: { label: 'View', getItems: getViewMenu },
		window: { label: 'Window', getItems: getWindowMenu },
		help: { label: 'Help', getItems: getHelpMenu },
	};
}
