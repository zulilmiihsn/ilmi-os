import { create } from 'zustand';
import type { WindowState } from '../types';
import { WINDOW } from '../constants';
import { generateId } from '../utils/id';

interface WindowsStore {
	windows: WindowState[];
	nextZIndex: number;
	openWindow: (
		window: Omit<WindowState, 'id' | 'zIndex' | 'isFocused'> & {
			originRect?: { x: number; y: number; width: number; height: number };
		}
	) => string;
	closeWindow: (id: string) => void;
	focusWindow: (id: string) => void;
	minimizeWindow: (id: string) => void;
	maximizeWindow: (id: string) => void;
	updateWindow: (id: string, updates: Partial<WindowState>) => void;
}

export const useWindowsStore = create<WindowsStore>()((set, get) => ({
	windows: [],
	nextZIndex: WINDOW.Z_INDEX_START,
	openWindow: window => {
		const id = generateId('window');
		const zIndex = get().nextZIndex;
		const newWindow: WindowState = {
			...window,
			id,
			zIndex,
			isFocused: true,
		};

		set(state => ({
			windows: state.windows.map(w => ({ ...w, isFocused: false })).concat(newWindow),
			nextZIndex: state.nextZIndex + 1,
		}));

		return id;
	},
	closeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.filter(w => w.id !== id),
		}));
	},
	focusWindow: (id: string) => {
		const zIndex = get().nextZIndex;
		set(state => ({
			windows: state.windows.map(w => ({
				...w,
				isFocused: w.id === id,
				zIndex: w.id === id ? zIndex : w.zIndex,
			})),
			nextZIndex: state.nextZIndex + 1,
		}));
	},
	minimizeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, isMinimized: true } : w)),
		}));
	},
	maximizeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
		}));
	},
	updateWindow: (id: string, updates: Partial<WindowState>) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, ...updates } : w)),
		}));
	},
}));
