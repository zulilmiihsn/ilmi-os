import { describe, it, expect, beforeEach } from 'vitest';
import { useAppsStore } from './apps';
import { useWindowsStore } from './windows';
import { useControlCenterStore } from './controlCenter';

// Stores are exercised through getState/setState: no React mounting needed.
describe('store APIs (Tahap 7)', () => {
	beforeEach(() => {
		useAppsStore.setState({ runningApps: [], iosAppPositions: { a: 0, b: 1 } });
		useWindowsStore.setState({ windows: [], nextZIndex: 1000 });
		useControlCenterStore.setState({ airplaneMode: false, wifi: true, cellular: true });
	});

	it('launches, tracks, and closes apps', () => {
		const store = useAppsStore.getState();
		expect(store.isAppRunning('mail')).toBe(false);
		store.launchApp('mail');
		expect(useAppsStore.getState().isAppRunning('mail')).toBe(true);
		useAppsStore.getState().closeApp('mail');
		expect(useAppsStore.getState().isAppRunning('mail')).toBe(false);
	});

	it('shifts (not swaps) icon positions on reorder', () => {
		useAppsStore.setState({ iosAppPositions: { a: 0, b: 1, c: 2 } });
		useAppsStore.getState().reorderIosApps(0, 2);
		// arrayMove semantics: b and c shift down, a lands at 2.
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 2, b: 0, c: 1 });
	});

	it('shifts upward moves symmetrically', () => {
		useAppsStore.setState({ iosAppPositions: { a: 0, b: 1, c: 2 } });
		useAppsStore.getState().reorderIosApps(2, 0);
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 1, b: 2, c: 0 });
	});

	it('relocates across regions and closes the vacated gap', () => {
		useAppsStore.setState({ iosAppPositions: { a: 0, b: 1, c: 2, d: 100 } });
		useAppsStore.getState().reorderIosApps(0, 100);
		const positions = useAppsStore.getState().iosAppPositions;
		expect(positions.a).toBe(100);
		expect(positions.b).toBe(0);
		expect(positions.c).toBe(1);
		// Uniqueness is preserved: no two apps share a position.
		const values = Object.values(positions);
		expect(new Set(values).size).toBe(values.length);
	});

	it('creates a folder from two apps at the target slot', () => {
		useAppsStore.setState({ iosAppPositions: { a: 0, b: 1, c: 2 }, folders: {} });
		const folderId = useAppsStore.getState().createFolder('a', 'c');
		expect(folderId).not.toBeNull();
		const state = useAppsStore.getState();
		expect(state.folders[folderId!]).toMatchObject({ appIds: ['c', 'a'] });
		expect(state.iosAppPositions[folderId!]).toBe(2);
		expect(state.iosAppPositions.a).toBeUndefined();
		expect(state.iosAppPositions.c).toBeUndefined();
		// b compacts into the vacated slot 0: no holes, no duplicates.
		expect(state.iosAppPositions.b).toBe(0);
		const values = Object.values(state.iosAppPositions);
		expect(new Set(values).size).toBe(values.length);
	});

	it('rejects folder creation involving folders, self, or dock apps', () => {
		useAppsStore.setState({
			iosAppPositions: { a: 0, b: 1, d: 100 },
			folders: { f1: { id: 'f1', name: 'Folder', appIds: ['x'] } },
		});
		const store = useAppsStore.getState();
		expect(store.createFolder('a', 'a')).toBeNull();
		expect(store.createFolder('a', 'f1')).toBeNull();
		expect(store.createFolder('f1', 'b')).toBeNull();
		expect(store.createFolder('d', 'b')).toBeNull();
		expect(store.createFolder('a', 'missing')).toBeNull();
	});

	it('moves apps into folders and dissolves on last removal', () => {
		useAppsStore.setState({
			iosAppPositions: { a: 0, b: 1, c: 2, f1: 5 },
			folders: { f1: { id: 'f1', name: 'Folder', appIds: ['x'] } },
		});
		expect(useAppsStore.getState().moveAppIntoFolder('c', 'f1')).toBe(true);
		let state = useAppsStore.getState();
		expect(state.folders.f1.appIds).toEqual(['x', 'c']);
		expect(state.iosAppPositions.c).toBeUndefined();

		expect(useAppsStore.getState().removeAppFromFolder('x', 'f1')).toBe(true);
		state = useAppsStore.getState();
		// One app left: folder dissolves and it inherits the folder slot.
		// (Slot 5 compacted to 4 when c left the page, then inherited.)
		expect(state.folders.f1).toBeUndefined();
		expect(state.iosAppPositions.c).toBe(4);
	});

	it('renames folders within limits', () => {
		useAppsStore.setState({ folders: { f1: { id: 'f1', name: 'Folder', appIds: ['a'] } } });
		expect(useAppsStore.getState().renameFolder('f1', '  Games  ')).toBe(true);
		expect(useAppsStore.getState().folders.f1.name).toBe('Games');
		expect(useAppsStore.getState().renameFolder('f1', '   ')).toBe(false);
		expect(useAppsStore.getState().renameFolder('missing', 'x')).toBe(false);
	});

	it('refuses moves into a full page instead of overflowing regions', () => {
		const fullPage: Record<string, number> = {};
		for (let i = 0; i < 24; i++) fullPage[`app${i}`] = i;
		fullPage.extra = 100;
		useAppsStore.setState({ iosAppPositions: fullPage });
		useAppsStore.getState().reorderIosApps(100, 5);
		expect(useAppsStore.getState().iosAppPositions.extra).toBe(100);
	});

	it('opens, focuses, and closes windows with rising z-index', () => {
		const windows = useWindowsStore.getState();
		const first = windows.openWindow({
			title: 'A',
			appId: 'notes',
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			isMaximized: false,
			isMinimized: false,
		});
		const second = useWindowsStore.getState().openWindow({
			title: 'B',
			appId: 'mail',
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			isMaximized: false,
			isMinimized: false,
		});
		const state = useWindowsStore.getState();
		expect(state.windows.find(w => w.id === second)?.isFocused).toBe(true);
		state.focusWindow(first);
		const focused = useWindowsStore.getState();
		expect(focused.windows.find(w => w.id === first)?.isFocused).toBe(true);
		expect(focused.windows.find(w => w.id === second)?.isFocused).toBe(false);
		focused.closeWindow(first);
		focused.closeWindow(second);
		expect(useWindowsStore.getState().windows).toEqual([]);
	});

	it('toggles airplane mode with its radio side effects', () => {
		useControlCenterStore.getState().toggleAirplaneMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			airplaneMode: true,
			wifi: false,
			cellular: false,
		});
	});
});
