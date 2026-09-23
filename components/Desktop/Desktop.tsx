'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ErrorBoundary } from '../ErrorBoundary';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import ContextMenu from './ContextMenu';
import { useWindowsStore } from '../../stores/windows';
import { useSettingsStore } from '../../stores/settings';
import { layoutExposeTiles } from '../../utils/exposeLayout';

import DesktopIcons from './DesktopIcons';

function Desktop() {
	const windows = useWindowsStore(state => state.windows);
	const { wallpaper } = useSettingsStore();
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

	// Exposé-lite (Mission Control approximation): spread all open windows —
	// minimized ones included — into tiles. F3 toggles, Esc exits, clicking
	// (or Enter on) a tile focuses it, unminimizing with the restore trip.
	const [exposeOpen, setExposeOpen] = useState(false);
	const prevFocusRef = useRef<Element | null>(null);

	const exitExpose = useCallback(() => {
		setExposeOpen(false);
		const el = prevFocusRef.current as HTMLElement | null;
		prevFocusRef.current = null;
		if (el && el.isConnected) el.focus();
	}, []);

	const enterExpose = useCallback(() => {
		if (useWindowsStore.getState().windows.length === 0) return;
		prevFocusRef.current = document.activeElement;
		setExposeOpen(true);
	}, []);

	const selectExposeWindow = useCallback(
		(id: string) => {
			const target = useWindowsStore.getState().windows.find(w => w.id === id);
			if (target?.isMinimized) {
				useWindowsStore.getState().updateWindow(id, { isMinimized: false });
			}
			if (target) useWindowsStore.getState().focusWindow(id);
			exitExpose();
		},
		[exitExpose]
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'F3') {
				e.preventDefault();
				if (exposeOpen) exitExpose();
				else enterExpose();
			} else if (e.key === 'Escape' && exposeOpen) {
				exitExpose();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [exposeOpen, enterExpose, exitExpose]);

	useEffect(() => {
		if (exposeOpen && windows.length === 0) exitExpose();
	}, [exposeOpen, windows.length, exitExpose]);

	const exposeTiles = useMemo(() => {
		if (!exposeOpen) return {};
		// Reserve the menubar strip on top and the dock zone at the bottom.
		const areaW = window.innerWidth;
		const areaH = Math.max(1, window.innerHeight - 170);
		const tiles = layoutExposeTiles(
			windows.map(w => ({ id: w.id, width: w.width, height: w.height })),
			{ width: areaW, height: areaH }
		);
		const yOffset = 40;
		for (const tile of Object.values(tiles)) tile.y += yOffset;
		return tiles;
	}, [exposeOpen, windows]);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setContextMenu({ x: e.pageX, y: e.pageY });
	};

	const closeContextMenu = () => {
		if (contextMenu) setContextMenu(null);
	};

	return (
		<ErrorBoundary>
			<div
				className="desktop w-screen h-screen overflow-hidden relative font-sans select-none"
				onContextMenu={handleContextMenu}
				onClick={closeContextMenu}
			>
				{/* Wallpaper */}
				<div className="wallpaper absolute inset-0 z-0 select-none will-change-transform">
					{wallpaper.startsWith('/') ? (
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

				{/* Desktop Icons */}
				<DesktopIcons />

				{/* Menu Bar */}
				<MenuBar />

				{/* Windows */}
				{windows.map(window => (
					<Window
						key={window.id}
						window={window}
						exposeTile={exposeOpen ? (exposeTiles[window.id] ?? null) : null}
						onExposeSelect={selectExposeWindow}
					/>
				))}

				{/* Exposé dim layer: below tiles, above wallpaper/icons. */}
				{exposeOpen && (
					<div
						className="expose-dim fixed inset-0 z-40 bg-black/45"
						onClick={exitExpose}
						aria-hidden="true"
					/>
				)}

				{/* Dock */}
				<Dock />

				{/* Context Menu */}
				{contextMenu && (
					<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu} />
				)}
			</div>
		</ErrorBoundary>
	);
}

export default Desktop;
