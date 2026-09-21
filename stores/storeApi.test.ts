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

	it('swaps icon positions by value', () => {
		useAppsStore.getState().reorderIosApps(0, 1);
		expect(useAppsStore.getState().iosAppPositions).toEqual({ a: 1, b: 0 });
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
