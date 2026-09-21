import { create } from 'zustand';
import type { AppMetadata } from '../types';
import { isIosApp, isMacosApp } from '../types';
import { IOS_LAYOUT } from '../constants';

export const DOCK_START_POSITION = IOS_LAYOUT.DOCK_BASE;
const DEFAULT_DOCK_IDS = ['safari', 'music', 'messages', 'phone'];

const defaultApps: AppMetadata[] = [
	// --- Dock Apps (Standard macOS Order) ---
	{
		id: 'finder',
		name: 'Finder',
		icon: '/media/Finder.svg',
		component: 'Finder',
		platform: 'macos',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'safari',
		name: 'Safari',
		icon: '/media/Safari.webp',
		component: 'placeholder',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'messages',
		name: 'Messages',
		icon: '/media/Message.webp',
		component: 'placeholder',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'mail',
		name: 'Mail',
		icon: '/media/Mail.webp',
		component: 'Mail',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'maps',
		name: 'Maps',
		icon: '/media/Maps.webp',
		component: 'Maps',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'photos',
		name: 'Photos',
		icon: '/media/Gallery.webp',
		component: 'Photos',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'calendar',
		name: 'Calendar',
		icon: '/media/Calendar.webp',
		component: 'Calendar',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'notes',
		name: 'Notes',
		icon: '/media/Note.webp',
		component: 'Notes',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'music',
		name: 'Music',
		icon: '/media/Music.webp',
		component: 'placeholder',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},
	{
		id: 'settings',
		name: 'Settings',
		icon: '/media/Settings.webp',
		component: 'Settings',
		platform: 'both',
		showInDock: true,
		showOnDesktop: false,
	},

	// --- Desktop Apps (Utilities & Others) ---
	{
		id: 'calculator',
		name: 'Calculator',
		icon: '/media/Calculator.svg',
		component: 'Calculator',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'clock',
		name: 'Clock',
		icon: '/media/Clock.webp',
		component: 'Clock',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'camera',
		name: 'Camera',
		icon: '/media/Camera.webp',
		component: 'Camera',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'files',
		name: 'Files',
		icon: '/media/Files.webp',
		component: 'Files',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'phone',
		name: 'Phone',
		icon: '/media/Call.webp',
		component: 'placeholder',
		platform: 'both',
		showInDock: false,
		showOnDesktop: true,
	},
	{
		id: 'terminal',
		name: 'Terminal',
		icon: '/media/Terminal.svg',
		component: 'Terminal',
		platform: 'macos',
		showInDock: false,
		showOnDesktop: true,
	},
];

function buildInitialPositions(apps: AppMetadata[]): Record<string, number> {
	const positions: Record<string, number> = {};
	let gridIndex = 0;
	for (const app of apps) {
		if (!isIosApp(app)) continue;
		const dockIndex = DEFAULT_DOCK_IDS.indexOf(app.id);
		if (dockIndex !== -1) {
			positions[app.id] = DOCK_START_POSITION + dockIndex;
		} else {
			positions[app.id] = gridIndex++;
		}
	}
	return positions;
}

interface AppsStore {
	apps: AppMetadata[];
	/** Serializable list of running app ids (was Set). */
	runningApps: string[];
	/** Serializable appId -> grid position map (was Map). Single source of truth for layout. */
	iosAppPositions: Record<string, number>;
	getAppById: (id: string) => AppMetadata | undefined;
	launchApp: (id: string) => void;
	closeApp: (id: string) => void;
	isAppRunning: (id: string) => boolean;
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
}

export const useAppsStore = create<AppsStore>((set, get) => ({
	apps: defaultApps,
	runningApps: [],
	iosAppPositions: buildInitialPositions(defaultApps),
	getAppById: (id: string) => {
		return get().apps.find(app => app.id === id);
	},
	launchApp: (id: string) => {
		set(state =>
			state.runningApps.includes(id) ? state : { runningApps: [...state.runningApps, id] }
		);
	},
	closeApp: (id: string) => {
		set(state => ({ runningApps: state.runningApps.filter(appId => appId !== id) }));
	},
	isAppRunning: (id: string) => {
		return get().runningApps.includes(id);
	},
	reorderIosApps: (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) return;
		set(state => {
			const entries = Object.entries(state.iosAppPositions);
			const fromEntry = entries.find(([, pos]) => pos === fromIndex);
			if (!fromEntry) return state;
			const [movingAppId] = fromEntry;
			const toEntry = entries.find(([, pos]) => pos === toIndex);

			const newPositions: Record<string, number> = { ...state.iosAppPositions };
			if (toEntry) {
				const [otherAppId] = toEntry;
				newPositions[movingAppId] = toIndex;
				newPositions[otherAppId] = fromIndex;
			} else {
				newPositions[movingAppId] = toIndex;
			}
			return { iosAppPositions: newPositions };
		});
	},
}));

// Selector functions for computed values
export const selectIosApps = (state: AppsStore) => state.apps.filter(isIosApp);

export const selectMacosApps = (state: AppsStore) => state.apps.filter(isMacosApp);
