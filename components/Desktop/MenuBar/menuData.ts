import type { WindowState } from '../../../types';
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
	updateWindow: (id: string, updates: Partial<WindowState>) => void;
}

export function buildMenus({
	activeAppName,
	activeWindow,
	windows,
	openWindow,
	closeWindow,
	minimizeWindow,
	updateWindow,
}: BuildMenusParams): Record<string, MenuDefinition> {
	const getAppleMenu = (): MenuItem[] => [
		{
			label: 'About This Mac',
			action: () =>
				openWindow({
					appId: 'finder',
					title: 'About This Mac',
					x: 200,
					y: 150,
					width: 400,
					height: 300,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ type: 'separator' },
		{
			label: 'System Preferences...',
			action: () =>
				openWindow({
					appId: 'settings',
					title: 'Settings',
					x: 100,
					y: 100,
					width: 900,
					height: 600,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ label: 'App Store...', action: () => alert('App Store is currently unavailable.') },
		{ type: 'separator' },
		{ label: 'Recent Items', submenu: [] },
		{ type: 'separator' },
		{ label: 'Force Quit...', shortcut: '⌥⌘Esc', action: () => {} },
		{ type: 'separator' },
		{ label: 'Sleep', action: () => document.documentElement.classList.toggle('grayscale') },
		{ label: 'Restart...', action: () => window.location.reload() },
		{ label: 'Shut Down...', action: () => window.close() },
		{ type: 'separator' },
		{ label: 'Lock Screen', shortcut: '⌃⌘Q', action: () => alert('Screen Locked') },
		{ label: 'Log Out User...', shortcut: '⇧⌘Q', action: () => alert('Logging Out...') },
	];

	const getAppMenu = (): MenuItem[] => [
		{
			label: `About ${activeAppName}`,
			action: () => alert(`iLmi OS ${activeAppName}\nVersion 1.0.0`),
		},
		{ type: 'separator' },
		{
			label: 'Preferences...',
			shortcut: '⌘,',
			action: () =>
				openWindow({
					appId: 'settings',
					title: 'Settings',
					x: 150,
					y: 150,
					width: 800,
					height: 600,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ type: 'separator' },
		{
			label: `Hide ${activeAppName}`,
			shortcut: '⌘H',
			action: () => {
				if (activeWindow) minimizeWindow(activeWindow.id);
			},
		},
		{
			label: 'Show All',
			action: () => {
				windows.forEach(w => {
					if (w.isMinimized) updateWindow(w.id, { isMinimized: false });
				});
			},
		},
		{ type: 'separator' },
		{
			label: `Quit ${activeAppName}`,
			shortcut: '⌘Q',
			disabled: activeAppName === 'Finder',
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
					x: 100,
					y: 100,
					width: 800,
					height: 500,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{
			label: 'New Folder',
			shortcut: '⇧⌘N',
			disabled: activeAppName !== 'Finder',
			action: () => alert('Create Folder action triggered'),
		},
		{ label: 'Open...', shortcut: '⌘O', action: () => {} },
		{ type: 'separator' },
		{
			label: 'Close Window',
			shortcut: '⌘W',
			disabled: !activeWindow,
			action: () => activeWindow && closeWindow(activeWindow.id),
		},
	];

	const getEditMenu = (): MenuItem[] => [
		{ label: 'Undo', shortcut: '⌘Z', action: () => {} },
		{ label: 'Redo', shortcut: '⇧⌘Z', action: () => {} },
		{ type: 'separator' },
		{ label: 'Cut', shortcut: '⌘X', action: () => navigator.clipboard.writeText('Simulated Cut') },
		{
			label: 'Copy',
			shortcut: '⌘C',
			action: () => navigator.clipboard.writeText('Simulated Copy'),
		},
		{ label: 'Paste', shortcut: '⌘V', action: () => alert('Paste triggered') },
		{ label: 'Select All', shortcut: '⌘A', action: () => {} },
	];

	const getViewMenu = (): MenuItem[] => [
		{ label: 'As Icons', disabled: activeAppName !== 'Finder', action: () => {} },
		{ label: 'As List', disabled: activeAppName !== 'Finder', action: () => {} },
		{ label: 'As Columns', disabled: activeAppName !== 'Finder', action: () => {} },
		{ type: 'separator' },
		{
			label: 'Enter Full Screen',
			shortcut: '⌃⌘F',
			action: () => {
				if (!document.fullscreenElement) {
					document.documentElement.requestFullscreen().catch(e => console.error(e));
				} else {
					document.exitFullscreen();
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
		{ label: 'Zoom', disabled: !activeWindow, action: () => {} },
		{ type: 'separator' },
		{
			label: 'Bring All to Front',
			action: () => {
				// Bring all windows to front by updating z-indices?
				// For now, just re-focus the last one.
			},
		},
	];

	const getHelpMenu = (): MenuItem[] => [
		{
			label: `${activeAppName} Help`,
			action: () => alert(`Help for ${activeAppName} coming soon.`),
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
