import { create } from 'zustand';
import type { AppMetadata } from '../types';
import { isIosApp, isMacosApp } from '../types';
import { IOS_LAYOUT } from '../constants';
import { generateId } from '../utils/id';

export interface AppFolder {
	id: string;
	name: string;
	appIds: string[];
}

export const FOLDER_MAX_APPS = 9;

function regionOf(pos: number): 'page0' | 'page1' | 'dock' {
	if (pos >= IOS_LAYOUT.DOCK_BASE) return 'dock';
	if (pos >= IOS_LAYOUT.PAGE1_BASE) return 'page1';
	return 'page0';
}

function regionBase(region: 'page0' | 'page1' | 'dock'): number {
	if (region === 'dock') return IOS_LAYOUT.DOCK_BASE;
	if (region === 'page1') return IOS_LAYOUT.PAGE1_BASE;
	return 0;
}

/** First free absolute slot across both pages, or null when full. */
export function findFreePageSlot(positions: Record<string, number>): number | null {
	const used = new Set(Object.values(positions));
	for (let i = 0; i < IOS_LAYOUT.PAGE0_SIZE; i++) {
		if (!used.has(i)) return i;
	}
	for (let i = 0; i < IOS_LAYOUT.PAGE1_SIZE; i++) {
		if (!used.has(IOS_LAYOUT.PAGE1_BASE + i)) return IOS_LAYOUT.PAGE1_BASE + i;
	}
	return null;
}

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
	/** Folders occupy position slots; member apps leave the position map. */
	folders: Record<string, AppFolder>;
	getAppById: (id: string) => AppMetadata | undefined;
	launchApp: (id: string) => void;
	closeApp: (id: string) => void;
	isAppRunning: (id: string) => boolean;
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
	getFolderById: (id: string) => AppFolder | undefined;
	isFolderId: (id: string) => boolean;
	renameFolder: (id: string, name: string) => boolean;
	/** Create a folder from two page apps; the folder takes target's slot. */
	createFolder: (draggedAppId: string, targetAppId: string) => string | null;
	/** Move a loose app into an existing folder. */
	moveAppIntoFolder: (appId: string, folderId: string) => boolean;
	/** Remove an app from a folder back to the first free page slot. */
	removeAppFromFolder: (appId: string, folderId: string) => boolean;
}

export const useAppsStore = create<AppsStore>((set, get) => ({
	apps: defaultApps,
	runningApps: [],
	iosAppPositions: buildInitialPositions(defaultApps),
	folders: {},
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
			const fromRegion = regionOf(fromIndex);
			const toRegion = regionOf(toIndex);

			// Mirror the UI's arrayMove semantics: shift the affected range
			// instead of swapping endpoints, so committed positions match the
			// layout the user already saw during the drag.
			const newPositions: Record<string, number> = { ...state.iosAppPositions };
			if (fromRegion === toRegion) {
				for (const [id, pos] of entries) {
					if (id === movingAppId) continue;
					if (regionOf(pos) !== fromRegion) continue;
					if (fromIndex < toIndex && pos > fromIndex && pos <= toIndex) {
						newPositions[id] = pos - 1;
					} else if (fromIndex > toIndex && pos < fromIndex && pos >= toIndex) {
						newPositions[id] = pos + 1;
					}
				}
				newPositions[movingAppId] = toIndex;
			} else {
				// Cross-region relocate: close the gap left behind and open
				// one at the destination within each affected region.
				// Page regions have fixed slot counts; refuse the move when
				// the destination is full instead of overflowing positions
				// into the next region. The dock is unbounded.
				const regionSize =
					toRegion === 'dock'
						? Number.POSITIVE_INFINITY
						: toRegion === 'page1'
							? IOS_LAYOUT.PAGE1_SIZE
							: IOS_LAYOUT.PAGE0_SIZE;
				const toOccupants = entries.filter(([, pos]) => regionOf(pos) === toRegion).length;
				if (toOccupants >= regionSize) return state;
				const fromBase = regionBase(fromRegion);
				for (const [id, pos] of entries) {
					if (id === movingAppId) continue;
					if (regionOf(pos) === fromRegion && pos > fromIndex) {
						newPositions[id] = Math.max(fromBase, pos - 1);
					} else if (regionOf(pos) === toRegion && pos >= toIndex) {
						newPositions[id] = pos + 1;
					}
				}
				newPositions[movingAppId] = toIndex;
			}
			return { iosAppPositions: newPositions };
		});
	},
	getFolderById: id => {
		return get().folders[id];
	},
	renameFolder: (id, name) => {
		const folder = get().folders[id];
		const trimmed = name.trim().slice(0, 24);
		if (!folder || !trimmed) return false;
		set(state => ({
			folders: { ...state.folders, [id]: { ...folder, name: trimmed } },
		}));
		return true;
	},
	isFolderId: id => {
		return get().folders[id] !== undefined;
	},
	createFolder: (draggedAppId, targetAppId) => {
		const state = get();
		if (draggedAppId === targetAppId) return null;
		if (state.folders[draggedAppId] || state.folders[targetAppId]) return null;
		const draggedPos = state.iosAppPositions[draggedAppId];
		const targetPos = state.iosAppPositions[targetAppId];
		if (draggedPos === undefined || targetPos === undefined) return null;
		// Folders live on pages only, never in the dock.
		if (regionOf(draggedPos) === 'dock' || regionOf(targetPos) === 'dock') return null;
		const folderId = generateId('folder');
		const newPositions = { ...state.iosAppPositions };
		delete newPositions[draggedAppId];
		delete newPositions[targetAppId];
		// The folder takes the target slot. Close the dragged gap only
		// strictly between the two slots (toward the dragged side): this
		// mapping is bijective, so positions stay unique. Adjacent drops
		// leave a single valid empty slot at the dragged position.
		for (const [id, pos] of Object.entries(newPositions)) {
			if (regionOf(pos) !== regionOf(draggedPos)) continue;
			if (draggedPos < targetPos && pos > draggedPos && pos < targetPos) {
				newPositions[id] = pos - 1;
			} else if (draggedPos > targetPos && pos > targetPos && pos < draggedPos) {
				newPositions[id] = pos + 1;
			}
		}
		newPositions[folderId] = targetPos;
		set({
			iosAppPositions: newPositions,
			folders: {
				...state.folders,
				[folderId]: { id: folderId, name: 'Folder', appIds: [targetAppId, draggedAppId] },
			},
		});
		return folderId;
	},
	moveAppIntoFolder: (appId, folderId) => {
		const state = get();
		const folder = state.folders[folderId];
		const pos = state.iosAppPositions[appId];
		if (!folder || pos === undefined || state.folders[appId]) return false;
		if (regionOf(pos) === 'dock') return false;
		if (folder.appIds.length >= FOLDER_MAX_APPS) return false;
		if (folder.appIds.includes(appId)) return false;
		const newPositions = { ...state.iosAppPositions };
		delete newPositions[appId];
		for (const [id, p] of Object.entries(newPositions)) {
			if (regionOf(p) === regionOf(pos) && p > pos) {
				newPositions[id] = Math.max(regionBase(regionOf(pos)), p - 1);
			}
		}
		set({
			iosAppPositions: newPositions,
			folders: {
				...state.folders,
				[folderId]: { ...folder, appIds: [...folder.appIds, appId] },
			},
		});
		return true;
	},
	removeAppFromFolder: (appId, folderId) => {
		const state = get();
		const folder = state.folders[folderId];
		if (!folder || !folder.appIds.includes(appId)) return false;
		const folderPos = state.iosAppPositions[folderId];
		if (folderPos === undefined) return false;
		const remaining = folder.appIds.filter(id => id !== appId);
		const freedSlot = findFreePageSlot(state.iosAppPositions);
		if (freedSlot === null) return false;
		const newPositions = { ...state.iosAppPositions };
		const newFolders = { ...state.folders };
		if (remaining.length <= 1) {
			// Dissolve: the last app inherits the folder's slot.
			delete newFolders[folderId];
			delete newPositions[folderId];
			if (remaining.length === 1) {
				const survivor = remaining[0];
				if (survivor !== undefined) {
					newPositions[survivor] = folderPos;
				}
			}
			newPositions[appId] = freedSlot;
		} else {
			newPositions[appId] = freedSlot;
			newFolders[folderId] = { ...folder, appIds: remaining };
		}
		set({ iosAppPositions: newPositions, folders: newFolders });
		return true;
	},
}));

// Selector functions for computed values
export const selectIosApps = (state: AppsStore) => state.apps.filter(isIosApp);

export const selectMacosApps = (state: AppsStore) => state.apps.filter(isMacosApp);
