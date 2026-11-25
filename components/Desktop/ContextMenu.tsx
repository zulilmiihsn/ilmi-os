'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { createUniqueFolder } from '../../utils/fileSystem';

interface ContextMenuProps {
	x: number;
	y: number;
	onClose: () => void;
}

function dispatchOpenApp(appId: string): void {
	window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: appId }));
}

export default function ContextMenu({ x, y, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const darkMode = useSettingsStore(state => state.darkMode);

	// Adjust position if menu goes off-screen
	useEffect(() => {
		if (menuRef.current) {
			const rect = menuRef.current.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			const width = rect.width;
			const height = rect.height;

			let finalX = x;
			let finalY = y;

			if (finalX + width > windowWidth - 4) {
				finalX = x - width;
			}
			if (finalY + height > windowHeight - 4) {
				finalY = y - height;
			}

			finalX = Math.max(4, finalX);
			finalY = Math.max(32, finalY);

			menuRef.current.style.left = `${finalX}px`;
			menuRef.current.style.top = `${finalY}px`;
		}
	}, [x, y]);

	// Close on Escape.
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	const menuItems: (
		| { type: 'separator' }
		| { type?: 'item'; label: string; action: () => void; disabled?: boolean }
	)[] = [
		{
			label: 'New Folder',
			action: () => {
				if (createUniqueFolder('Untitled Folder', 'folder-desktop')) {
					dispatchOpenApp('finder');
				}
			},
		},
		{
			label: 'Open Finder',
			action: () => dispatchOpenApp('finder'),
		},
		{ type: 'separator' },
		{
			label: 'Change Wallpaper...',
			action: () => dispatchOpenApp('settings'),
		},
		{
			label: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
			action: () => useSettingsStore.getState().toggleDarkMode(),
		},
		{ type: 'separator' },
		{ label: 'Refresh', action: () => window.location.reload() },
	];

	return (
		<div
			ref={menuRef}
			role="menu"
			aria-label="Desktop context menu"
			className="fixed z-[9999] min-w-[200px] py-1.5 rounded-lg bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl text-sm select-none animate-in fade-in zoom-in-95 duration-100"
			style={{
				left: Math.max(4, x),
				top: Math.max(32, y),
			}}
		>
			{menuItems.map((item, index) => {
				if (item.type === 'separator') {
					return <div key={index} className="h-px my-1 mx-3 bg-gray-400/20 dark:bg-white/10" />;
				}

				return (
					<button
						key={index}
						type="button"
						role="menuitem"
						disabled={item.disabled}
						className={`
							w-[calc(100%-0.5rem)] text-left px-4 py-1.5 mx-1 rounded-md cursor-default
							flex items-center justify-between
							${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ios-blue hover:text-white'}
							text-gray-800 dark:text-gray-100 transition-colors duration-75
						`}
						onClick={e => {
							e.stopPropagation();
							if (!item.disabled) {
								item.action();
								onClose();
							}
						}}
					>
						<span>{item.label}</span>
					</button>
				);
			})}
		</div>
	);
}
