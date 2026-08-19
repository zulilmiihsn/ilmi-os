'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ErrorBoundary } from '../ErrorBoundary';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import ContextMenu from './ContextMenu';
import { useWindowsStore } from '../../stores/windows';
import { useSettingsStore } from '../../stores/settings';

import DesktopIcons from './DesktopIcons';

function Desktop() {
	const windows = useWindowsStore(state => state.windows);
	const { wallpaper } = useSettingsStore();
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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
					<Window key={window.id} window={window} />
				))}

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
