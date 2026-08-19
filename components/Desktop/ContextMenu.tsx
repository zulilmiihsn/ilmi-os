'use client';

import { useEffect, useRef } from 'react';

interface ContextMenuProps {
	x: number;
	y: number;
	onClose: () => void;
}

export default function ContextMenu({ x, y, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Adjust position if menu goes off-screen
	useEffect(() => {
		if (menuRef.current) {
			const rect = menuRef.current.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// If scaling messes up rect, use offsetWidth/Height
			const width = rect.width;
			const height = rect.height;

			let finalX = x;
			let finalY = y;

			// Check right edge
			if (x + width > windowWidth) {
				finalX = x - width;
			}

			// Check bottom edge
			if (y + height > windowHeight) {
				finalY = y - height;
			}

			menuRef.current.style.left = `${finalX}px`;
			menuRef.current.style.top = `${finalY}px`;
		}
	}, [x, y]);

	// Close on click outside (already handled by parent usually, but fail-safe)
	// Actually parent (Desktop) handles global click closing.

	const menuItems = [
		{ label: 'New Folder', action: () => {}, disabled: false },
		{ label: 'Get Info', action: () => {}, disabled: false },
		{ type: 'separator' },
		{
			label: 'Change Wallpaper...',
			action: () => {},
			disabled: false,
		},
		{ type: 'separator' },
		{ label: 'Refresh', action: () => window.location.reload(), disabled: false },
	];

	return (
		<div
			ref={menuRef}
			className="fixed z-[9999] min-w-[200px] py-1.5 rounded-lg bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl text-sm select-none animate-in fade-in zoom-in-95 duration-100"
			style={{
				left: x,
				top: y,
			}}
		>


			{menuItems.map((item, index) => {
				if (item.type === 'separator') {
					return <div key={index} className="h-px my-1 mx-3 bg-gray-400/20 dark:bg-white/10" />;
				}

				return (
					<div
						key={index}
						className={`
                            px-4 py-1.5 mx-1 rounded-md cursor-default
                            flex items-center justify-between
                            ${
															item.disabled
																? 'opacity-50 cursor-not-allowed'
																: 'hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600'
														}
                            text-gray-800 dark:text-gray-100 transition-colors duration-75
                        `}
						onClick={e => {
							e.stopPropagation();
							if (!item.disabled && item.action) {
								item.action();
								onClose();
							}
						}}
					>
						<span>{item.label}</span>
					</div>
				);
			})}
		</div>
	);
}
