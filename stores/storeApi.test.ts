import { describe, it, expect, beforeEach } from 'vitest';
import { selectIosApps, useAppsStore } from './apps';
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

describe('store coverage (Tahap 6)', () => {
	beforeEach(() => {
		useAppsStore.setState({ runningApps: [], iosAppPositions: { a: 0, b: 1 } });
		useWindowsStore.setState({ windows: [], nextZIndex: 1000 });
		useControlCenterStore.setState({
			isOpen: false,
			wifi: true,
			bluetooth: true,
			cellular: true,
			airplaneMode: false,
			focusMode: false,
			activeFocus: null,
			brightness: 85,
			volume: 65,
		});
	});

	it('opens, closes, and toggles control center plus radios', () => {
		const store = useControlCenterStore.getState();
		store.open();
		expect(useControlCenterStore.getState().isOpen).toBe(true);
		useControlCenterStore.getState().toggle();
		expect(useControlCenterStore.getState().isOpen).toBe(false);
		useControlCenterStore.getState().toggleWifi();
		expect(useControlCenterStore.getState().wifi).toBe(false);
		useControlCenterStore.getState().toggleBluetooth();
		expect(useControlCenterStore.getState().bluetooth).toBe(false);
		useControlCenterStore.getState().close();
		expect(useControlCenterStore.getState().isOpen).toBe(false);
	});

	it('restores radios when airplane mode turns off', () => {
		useControlCenterStore.getState().toggleAirplaneMode();
		useControlCenterStore.getState().toggleAirplaneMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			airplaneMode: false,
			wifi: true,
			cellular: true,
		});
	});

	it('couples focus mode with its active focus', () => {
		useControlCenterStore.getState().toggleFocusMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			focusMode: true,
			activeFocus: 'Do Not Disturb',
		});
		useControlCenterStore.getState().setActiveFocus('Work');
		expect(useControlCenterStore.getState()).toMatchObject({
			focusMode: true,
			activeFocus: 'Work',
		});
		useControlCenterStore.getState().setActiveFocus(null);
		expect(useControlCenterStore.getState()).toMatchObject({
			focusMode: false,
			activeFocus: null,
		});
		useControlCenterStore.getState().setBrightness(40);
		useControlCenterStore.getState().setVolume(20);
		expect(useControlCenterStore.getState()).toMatchObject({ brightness: 40, volume: 20 });
		useControlCenterStore.getState().toggleFocusMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			focusMode: true,
			activeFocus: 'Do Not Disturb',
		});
	});

	it('keeps a preset focus when toggling on', () => {
		useControlCenterStore.setState({ focusMode: false, activeFocus: 'Sleep' });
		useControlCenterStore.getState().toggleFocusMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			focusMode: true,
			activeFocus: 'Sleep',
		});
	});

	it('flips the remaining quick toggles', () => {
		const store = useControlCenterStore.getState();
		store.toggleCellular();
		store.toggleAirdrop();
		store.toggleFlashlight();
		store.toggleLowPowerMode();
		store.toggleOrientationLock();
		store.toggleSilentMode();
		expect(useControlCenterStore.getState()).toMatchObject({
			cellular: false,
			airdrop: false,
			flashlight: true,
			lowPowerMode: true,
			orientationLock: false,
			silentMode: false,
		});
	});

	it('minimizes, maximizes, and updates one window at a time', () => {
		const base = {
			title: 'W',
			appId: 'notes',
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			isMaximized: false,
			isMinimized: false,
		};
		const first = useWindowsStore.getState().openWindow(base);
		const second = useWindowsStore.getState().openWindow({ ...base, title: 'V' });
		useWindowsStore.getState().minimizeWindow(first);
		let state = useWindowsStore.getState();
		expect(state.windows.find(w => w.id === first)?.isMinimized).toBe(true);
		expect(state.windows.find(w => w.id === second)?.isMinimized).toBe(false);
		useWindowsStore.getState().maximizeWindow(first);
		useWindowsStore.getState().maximizeWindow(first);
		state = useWindowsStore.getState();
		expect(state.windows.find(w => w.id === first)?.isMaximized).toBe(false);
		useWindowsStore.getState().updateWindow(second, { x: 10, y: 20 });
		state = useWindowsStore.getState();
		expect(state.windows.find(w => w.id === second)).toMatchObject({ x: 10, y: 20 });
		expect(state.windows.find(w => w.id === first)).toMatchObject({ x: 0, y: 0 });
	});

	it('ignores reorder and lookup misses without corrupting state', () => {
		useAppsStore.getState().reorderIosApps(0, 0);
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 0, b: 1 });
		useAppsStore.getState().reorderIosApps(99, 0);
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 0, b: 1 });
		expect(useAppsStore.getState().getAppById('missing')).toBeUndefined();
		expect(useAppsStore.getState().getAppById('a')).toBeUndefined();
	});

	it('skips foreign regions when shifting a reorder', () => {
		useAppsStore.setState({ iosAppPositions: { a: 0, b: 1, d: 100 } });
		useAppsStore.getState().reorderIosApps(0, 1);
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 1, b: 0, d: 100 });
	});

	it('selects ios apps for the mobile shell', () => {
		expect(selectIosApps(useAppsStore.getState()).length).toBeGreaterThan(0);
		expect(
			selectIosApps(useAppsStore.getState()).every(app => app.platform !== 'macos')
		).toBe(true);
	});
});
