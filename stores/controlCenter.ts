import { create } from 'zustand';

interface ControlCenterStore {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;

	// Mobile & Desktop Quick Controls
	wifi: boolean;
	bluetooth: boolean;
	cellular: boolean;
	airdrop: boolean;
	airplaneMode: boolean;
	flashlight: boolean;
	lowPowerMode: boolean;
	orientationLock: boolean;
	silentMode: boolean;
	focusMode: boolean;
	activeFocus: 'Do Not Disturb' | 'Work' | 'Personal' | 'Sleep' | null;
	brightness: number;
	volume: number;

	toggleWifi: () => void;
	toggleBluetooth: () => void;
	toggleCellular: () => void;
	toggleAirdrop: () => void;
	toggleAirplaneMode: () => void;
	toggleFlashlight: () => void;
	toggleLowPowerMode: () => void;
	toggleOrientationLock: () => void;
	toggleSilentMode: () => void;
	toggleFocusMode: () => void;
	setActiveFocus: (focus: 'Do Not Disturb' | 'Work' | 'Personal' | 'Sleep' | null) => void;
	setBrightness: (val: number) => void;
	setVolume: (val: number) => void;
}

export const useControlCenterStore = create<ControlCenterStore>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),

	wifi: true,
	bluetooth: true,
	cellular: true,
	airdrop: true,
	airplaneMode: false,
	flashlight: false,
	lowPowerMode: false,
	orientationLock: true,
	silentMode: true,
	focusMode: false,
	activeFocus: null,
	brightness: 85,
	volume: 65,

	toggleWifi: () => set((state) => ({ wifi: !state.wifi })),
	toggleBluetooth: () => set((state) => ({ bluetooth: !state.bluetooth })),
	toggleCellular: () => set((state) => ({ cellular: !state.cellular })),
	toggleAirdrop: () => set((state) => ({ airdrop: !state.airdrop })),
	toggleAirplaneMode: () =>
		set((state) => ({
			airplaneMode: !state.airplaneMode,
			wifi: state.airplaneMode ? true : false,
			cellular: state.airplaneMode ? true : false,
		})),
	toggleFlashlight: () => set((state) => ({ flashlight: !state.flashlight })),
	toggleLowPowerMode: () => set((state) => ({ lowPowerMode: !state.lowPowerMode })),
	toggleOrientationLock: () => set((state) => ({ orientationLock: !state.orientationLock })),
	toggleSilentMode: () => set((state) => ({ silentMode: !state.silentMode })),
	toggleFocusMode: () =>
		set((state) => ({
			focusMode: !state.focusMode,
			activeFocus: !state.focusMode ? (state.activeFocus || 'Do Not Disturb') : null,
		})),
	setActiveFocus: (focus) =>
		set({
			activeFocus: focus,
			focusMode: Boolean(focus),
		}),
	setBrightness: (brightness) => set({ brightness }),
	setVolume: (volume) => set({ volume }),
}));
