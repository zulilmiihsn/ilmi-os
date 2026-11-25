'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ErrorBoundary } from '../ErrorBoundary';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import ContextMenu from './ContextMenu';
import AppSwitcher from './AppSwitcher';
import { useWindowsStore } from '../../stores/windows';
import { useAppsStore } from '../../stores/apps';
import { useSettingsStore, isImageWallpaper } from '../../stores/settings';
import { WINDOW } from '../../constants';
import { isMacosApp } from '../../types';
import { layoutExposeTiles } from '../../utils/exposeLayout';
import {
	findTopVisibleWindow,
	initialSwitcherIndex,
	isEditableTarget,
	isModalOrSpotlightOpen,
	nextSwitcherIndex,
	orderWindowsForSwitcher,
	resolveDesktopShortcut,
	resolveSwitcherKey,
} from '../../utils/desktopShortcuts';
import type { WindowState } from '../../types';
import DesktopIcons from './DesktopIcons';

interface SwitcherState {
	open: boolean;
	items: WindowState[];
	index: number;
}

const CLOSED_SWITCHER: SwitcherState = { open: false, items: [], index: 0 };

function restoreAndFocusWindow(id: string): void {
	const store = useWindowsStore.getState();
	const target = store.windows.find(w => w.id === id);
	if (target?.isMinimized) store.updateWindow(id, { isMinimized: false });
	if (target) store.focusWindow(id);
}

function restoreSavedFocus(ref: React.MutableRefObject<Element | null>): void {
	const el = ref.current;
	ref.current = null;
	if (el instanceof HTMLElement && el.isConnected) el.focus();
}

function Desktop() {
	const windows = useWindowsStore(state => state.windows);
	const { wallpaper } = useSettingsStore();
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
	const [exposeOpen, setExposeOpen] = useState(false);
	const [switcher, setSwitcher] = useState<SwitcherState>(CLOSED_SWITCHER);
	const switcherRef = useRef<SwitcherState>(CLOSED_SWITCHER);
	const prevFocusRef = useRef<Element | null>(null);

	const updateSwitcher = useCallback((next: SwitcherState) => {
		switcherRef.current = next;
		setSwitcher(next);
	}, []);

	const cancelSwitcher = useCallback(() => {
		updateSwitcher(CLOSED_SWITCHER);
		restoreSavedFocus(prevFocusRef);
	}, [updateSwitcher]);

	const commitSwitcherWindow = useCallback(
		(id: string) => {
			restoreAndFocusWindow(id);
			prevFocusRef.current = null;
			updateSwitcher(CLOSED_SWITCHER);
		},
		[updateSwitcher]
	);

	const exitExpose = useCallback(() => {
		setExposeOpen(false);
		restoreSavedFocus(prevFocusRef);
	}, []);

	const enterExpose = useCallback(() => {
		if (useWindowsStore.getState().windows.length === 0) return;
		prevFocusRef.current = document.activeElement;
		setExposeOpen(true);
	}, []);

	const selectExposeWindow = useCallback(
		(id: string) => {
			restoreAndFocusWindow(id);
			exitExpose();
		},
		[exitExpose]
	);

	useEffect(() => {
		const commitHighlighted = () => {
			const picked = switcherRef.current.items[switcherRef.current.index];
			if (picked) commitSwitcherWindow(picked.id);
			else cancelSwitcher();
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (switcherRef.current.open) {
				const nav = resolveSwitcherKey(e);
				if (!nav) return;
				e.preventDefault();
				if (nav === 'cancel') return cancelSwitcher();
				if (nav === 'commit') return commitHighlighted();
				const cur = switcherRef.current;
				const nextIdx = nextSwitcherIndex(cur.index, cur.items.length, nav === 'prev');
				if (nextIdx >= 0) updateSwitcher({ ...cur, index: nextIdx });
				return;
			}

			if (e.key === 'F3') {
				e.preventDefault();
				if (exposeOpen) exitExpose();
				else enterExpose();
				return;
			}
			if (e.key === 'Escape' && exposeOpen) return exitExpose();
			if (exposeOpen) return;

			const action = resolveDesktopShortcut(e);
			if (!action || isEditableTarget(e.target) || isModalOrSpotlightOpen()) return;
			e.preventDefault();

			const store = useWindowsStore.getState();
			if (action === 'close' || action === 'minimize') {
				const focused = store.windows.find(w => w.isFocused && !w.isMinimized);
				if (!focused) return;
				if (action === 'close') store.closeWindow(focused.id);
				else store.minimizeWindow(focused.id);
				const next = findTopVisibleWindow(store.windows, focused.id);
				if (next) store.focusWindow(next.id);
				return;
			}

			const ordered = orderWindowsForSwitcher(store.windows);
			const startIndex = initialSwitcherIndex(ordered.length, action === 'switch-prev');
			if (startIndex < 0) return;
			prevFocusRef.current = document.activeElement;
			updateSwitcher({ open: true, items: ordered, index: startIndex });
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key !== 'Alt' || !switcherRef.current.open) return;
			e.preventDefault();
			commitHighlighted();
		};

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		};
	}, [exposeOpen, enterExpose, exitExpose, updateSwitcher, cancelSwitcher, commitSwitcherWindow]);

	useEffect(() => {
		if (exposeOpen && windows.length === 0) exitExpose();
		if (switcherRef.current.open && windows.length === 0) cancelSwitcher();
	}, [exposeOpen, windows.length, exitExpose, cancelSwitcher]);

	useEffect(() => {
		const onOpenApp = (event: Event) => {
			const appId = (event as CustomEvent<string>).detail;
			if (!appId) return;
			const appsStore = useAppsStore.getState();
			const app = appsStore.apps.find(a => a.id === appId && isMacosApp(a));
			if (!app) return;
			appsStore.launchApp(app.id);
			const winStore = useWindowsStore.getState();
			const existing = winStore.windows.find(w => w.appId === app.id);
			if (existing) {
				if (existing.isMinimized) winStore.updateWindow(existing.id, { isMinimized: false });
				winStore.focusWindow(existing.id);
			} else {
				winStore.openWindow({
					title: app.name,
					appId: app.id,
					x: WINDOW.DEFAULT_X + Math.random() * 40,
					y: WINDOW.DEFAULT_Y + Math.random() * 40,
					width: app.defaultSize?.width ?? WINDOW.DEFAULT_WIDTH,
					height: app.defaultSize?.height ?? WINDOW.DEFAULT_HEIGHT,
					isMaximized: false,
					isMinimized: false,
				});
			}
		};
		window.addEventListener('ilmi:open-app', onOpenApp);
		return () => window.removeEventListener('ilmi:open-app', onOpenApp);
	}, []);

	const exposeTiles = useMemo(() => {
		if (!exposeOpen) return {};
		// Reserve the menubar strip on top and the dock zone at the bottom.
		const tiles = layoutExposeTiles(
			windows.map(w => ({ id: w.id, width: w.width, height: w.height })),
			{ width: window.innerWidth, height: Math.max(1, window.innerHeight - 170) }
		);
		for (const tile of Object.values(tiles)) tile.y += 40;
		return tiles;
	}, [exposeOpen, windows]);

	return (
		<ErrorBoundary>
			<div
				className="desktop w-screen h-screen overflow-hidden relative font-sans select-none"
				onContextMenu={e => {
					e.preventDefault();
					setContextMenu({ x: e.pageX, y: e.pageY });
				}}
				onClick={() => contextMenu && setContextMenu(null)}
			>
				<div className="wallpaper absolute inset-0 z-0 select-none will-change-transform">
					{isImageWallpaper(wallpaper) ? (
						<Image
							src={wallpaper}
							alt="Wallpaper"
							fill
							priority
							className="object-cover pointer-events-none"
							unoptimized
						/>
					) : (
						<div className="w-full h-full" style={{ background: wallpaper }} />
					)}
				</div>
				<DesktopIcons />
				<MenuBar />
				{windows.map(win => (
					<Window
						key={win.id}
						window={win}
						exposeTile={exposeOpen ? (exposeTiles[win.id] ?? null) : null}
						onExposeSelect={selectExposeWindow}
					/>
				))}
				{exposeOpen && (
					<div
						className="expose-dim fixed inset-0 z-40 bg-black/45"
						onClick={exitExpose}
						aria-hidden="true"
					/>
				)}
				{switcher.open && (
					<AppSwitcher
						windows={switcher.items}
						selectedIndex={switcher.index}
						onSelect={commitSwitcherWindow}
						onCancel={cancelSwitcher}
					/>
				)}
				<Dock />
				{contextMenu && (
					<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />
				)}
			</div>
		</ErrorBoundary>
	);
}

export default Desktop;
