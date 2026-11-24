'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import ControlCenter from './ControlCenter';
import { useControlCenterStore } from '../../stores/controlCenter';
import { useWindowsStore } from '../../stores/windows';
import MenuDropdown from './MenuDropdown';
import Spotlight from './Spotlight';
import SystemTray from './MenuBar/SystemTray';
import { buildMenus } from './MenuBar/menuData';
import { useSystemStatus } from './MenuBar/useSystemStatus';

export default function MenuBar() {
	const { batteryCharging, batteryColor, batteryFillWidth, isWifi } = useSystemStatus();

	// Spotlight State
	const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

	// Menu State
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const menuBarRef = useRef<HTMLDivElement>(null);

	const { windows, closeWindow, minimizeWindow, openWindow, updateWindow } = useWindowsStore();

	const activeWindow = windows.find(w => w.isFocused && !w.isMinimized);
	const activeAppName = activeWindow?.title || 'Finder';

	const toggleControlCenter = useControlCenterStore(state => state.toggle);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
				setActiveMenu(null);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	function handleToggleControlCenter(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		toggleControlCenter();
	}

	const menus = buildMenus({
		activeAppName,
		activeWindow,
		windows,
		openWindow,
		closeWindow,
		minimizeWindow,
		updateWindow,
	});

	const handleMenuClick = (menuId: string) => {
		setActiveMenu(activeMenu === menuId ? null : menuId);
	};

	const handleMenuHover = (menuId: string) => {
		if (activeMenu) {
			setActiveMenu(menuId);
		}
	};

	return (
		<>
			<div
				ref={menuBarRef}
				className="macos-menubar fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-6 text-xs z-[9999] select-none"
			>
				{/* Left: App Menu */}
				<div className="flex items-center gap-1 h-full">
					{/* Apple Logo */}
					<div className="relative h-full flex items-center">
						<button
							className={`h-full px-3 pl-0 flex items-center rounded-md transition-colors ${activeMenu === 'apple' ? 'bg-black/10' : 'hover:bg-transparent'}`}
							onClick={() => handleMenuClick('apple')}
							onMouseEnter={() => handleMenuHover('apple')}
							aria-label="Apple menu"
							aria-expanded={activeMenu === 'apple'}
							aria-haspopup="menu"
						>
							<svg className="w-4 h-4 fill-current text-black dark:text-white" viewBox="0 0 24 24">
								<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
							</svg>
						</button>
						<MenuDropdown
							items={menus.apple?.getItems() ?? []}
							isOpen={activeMenu === 'apple'}
							onClose={() => setActiveMenu(null)}
						/>
					</div>

					{/* Standard Menus */}
					{Object.keys(menus)
						.filter(key => key !== 'apple')
						.map(key => {
							const menu = menus[key];
							if (!menu) return null;
							return (
								<div key={key} className="relative h-full flex items-center">
									<button
										className={`h-[22px] px-3 my-auto flex items-center rounded-[4px] transition-colors cursor-default ${
											activeMenu === key ? 'bg-black/10 dark:bg-white/10' : ''
										} ${menu.bold ? 'font-bold' : 'text-black dark:text-white'}`}
										onClick={() => handleMenuClick(key)}
										onMouseEnter={() => handleMenuHover(key)}
									>
										{menu.label}
									</button>
									<MenuDropdown
										items={menu.getItems()}
										isOpen={activeMenu === key}
										onClose={() => setActiveMenu(null)}
									/>
								</div>
							);
						})}
				</div>

				{/* Right: System Icons */}
				<SystemTray
					isSpotlightOpen={isSpotlightOpen}
					onToggleSpotlight={() => setIsSpotlightOpen(!isSpotlightOpen)}
					isWifi={isWifi}
					batteryCharging={batteryCharging}
					batteryColor={batteryColor}
					batteryFillWidth={batteryFillWidth}
					onToggleControlCenter={handleToggleControlCenter}
				/>
			</div>

			<ControlCenter />
			<Spotlight isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} />
		</>
	);
}
