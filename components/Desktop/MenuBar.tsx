'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import ControlCenter from './ControlCenter';
import { useControlCenterStore } from '../../stores/controlCenter';
import { useWindowsStore } from '../../stores/windows';
import { getBatteryInfo, getNetworkInfo, isWifiConnected } from '../../utils/deviceInfo';
import type { BatteryManager } from '../../types/navigator';
import DesktopClock from './DesktopClock';
import MenuDropdown, { MenuItem } from './MenuDropdown';
import Spotlight from './Spotlight';

export default function MenuBar() {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [batteryCharging, setBatteryCharging] = useState(false);
	const [isWifi, setIsWifi] = useState(true);

	// Spotlight State
	const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

	// Menu State
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const menuBarRef = useRef<HTMLDivElement>(null);

	const { windows, closeWindow, minimizeWindow, openWindow, updateWindow } = useWindowsStore();

	const activeWindow = windows.find(w => w.isFocused && !w.isMinimized);
	const activeAppName = activeWindow?.title || 'Finder';

	const toggleControlCenter = useControlCenterStore(state => state.toggle);

	// Computed battery color based on level
	const batteryColor = useMemo(() => {
		if (batteryLevel === null) return '#000000'; // Black for desktop
		if (batteryLevel <= 20) return '#ff3b30'; // Red
		if (batteryLevel <= 50) return '#ff9500'; // Orange
		return '#000000'; // Black
	}, [batteryLevel]);

	// Computed battery fill width
	const batteryFillWidth = useMemo(() => {
		if (batteryLevel === null) return 100;
		return Math.max(0, Math.min(100, batteryLevel));
	}, [batteryLevel]);

	useEffect(() => {
		// Get battery info
		async function updateBattery() {
			const battery = await getBatteryInfo();
			if (battery) {
				setBatteryLevel(Math.round(battery.level * 100));
				setBatteryCharging(battery.charging);
			}
		}

		// Get network info
		function updateNetwork() {
			const network = getNetworkInfo();
			if (network) {
				setIsWifi(isWifiConnected(network));
			}
		}

		// Initial load
		updateBattery();
		updateNetwork();

		// Track disposal so late async results never attach listeners afterwards.
		let disposed = false;
		let batteryTarget: BatteryManager | null = null;

		// Listen for battery changes
		if (typeof window !== 'undefined' && navigator.getBattery) {
			navigator
				.getBattery()
				.then(battery => {
					if (disposed) return;
					batteryTarget = battery;
					battery.addEventListener('chargingchange', updateBattery);
					battery.addEventListener('levelchange', updateBattery);
				})
				.catch(() => {
					// Battery API not available
				});
		}

		// Listen for network changes
		const connection =
			navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		if (connection) {
			connection.addEventListener('change', updateNetwork);
		}

		const networkInterval = setInterval(updateNetwork, 5000);

		// Click outside to close menu
		function handleClickOutside(event: MouseEvent) {
			if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
				setActiveMenu(null);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			disposed = true;
			clearInterval(networkInterval);
			document.removeEventListener('mousedown', handleClickOutside);
			if (batteryTarget) {
				batteryTarget.removeEventListener('chargingchange', updateBattery);
				batteryTarget.removeEventListener('levelchange', updateBattery);
				batteryTarget = null;
			}
			if (connection) {
				connection.removeEventListener('change', updateNetwork);
			}
		};
	}, []);

	function handleToggleControlCenter(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		toggleControlCenter();
	}

	// MENU DATA GENERATORS
	const getAppleMenu = (): MenuItem[] => [
		{
			label: 'About This Mac',
			action: () =>
				openWindow({
					appId: 'finder',
					title: 'About This Mac',
					x: 200,
					y: 150,
					width: 400,
					height: 300,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ type: 'separator' },
		{
			label: 'System Preferences...',
			action: () =>
				openWindow({
					appId: 'settings',
					title: 'Settings',
					x: 100,
					y: 100,
					width: 900,
					height: 600,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ label: 'App Store...', action: () => alert('App Store is currently unavailable.') },
		{ type: 'separator' },
		{ label: 'Recent Items', submenu: [] },
		{ type: 'separator' },
		{ label: 'Force Quit...', shortcut: '⌥⌘Esc', action: () => {} },
		{ type: 'separator' },
		{ label: 'Sleep', action: () => document.documentElement.classList.toggle('grayscale') },
		{ label: 'Restart...', action: () => window.location.reload() },
		{ label: 'Shut Down...', action: () => window.close() },
		{ type: 'separator' },
		{ label: 'Lock Screen', shortcut: '⌃⌘Q', action: () => alert('Screen Locked') },
		{ label: 'Log Out User...', shortcut: '⇧⌘Q', action: () => alert('Logging Out...') },
	];

	const getAppMenu = (): MenuItem[] => [
		{
			label: `About ${activeAppName}`,
			action: () => alert(`iLmi OS ${activeAppName}\nVersion 1.0.0`),
		},
		{ type: 'separator' },
		{
			label: 'Preferences...',
			shortcut: '⌘,',
			action: () =>
				openWindow({
					appId: 'settings',
					title: 'Settings',
					x: 150,
					y: 150,
					width: 800,
					height: 600,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{ type: 'separator' },
		{
			label: `Hide ${activeAppName}`,
			shortcut: '⌘H',
			action: () => {
				if (activeWindow) minimizeWindow(activeWindow.id);
			},
		},
		{
			label: 'Show All',
			action: () => {
				windows.forEach(w => {
					if (w.isMinimized) updateWindow(w.id, { isMinimized: false });
				});
			},
		},

		{ type: 'separator' },
		{
			label: `Quit ${activeAppName}`,
			shortcut: '⌘Q',
			disabled: activeAppName === 'Finder',
			action: () => {
				if (activeWindow) closeWindow(activeWindow.id);
			},
		},
	];

	const getFileMenu = (): MenuItem[] => [
		{
			label: 'New Finder Window',
			shortcut: '⌘N',
			action: () =>
				openWindow({
					appId: 'finder',
					title: 'Finder',
					x: 100,
					y: 100,
					width: 800,
					height: 500,
					isMaximized: false,
					isMinimized: false,
				}),
		},
		{
			label: 'New Folder',
			shortcut: '⇧⌘N',
			disabled: activeAppName !== 'Finder',
			action: () => alert('Create Folder action triggered'),
		},
		{ label: 'Open...', shortcut: '⌘O', action: () => {} },
		{ type: 'separator' },
		{
			label: 'Close Window',
			shortcut: '⌘W',
			disabled: !activeWindow,
			action: () => activeWindow && closeWindow(activeWindow.id),
		},
	];

	const getEditMenu = (): MenuItem[] => [
		{ label: 'Undo', shortcut: '⌘Z', action: () => {} },
		{ label: 'Redo', shortcut: '⇧⌘Z', action: () => {} },
		{ type: 'separator' },
		{ label: 'Cut', shortcut: '⌘X', action: () => navigator.clipboard.writeText('Simulated Cut') },
		{
			label: 'Copy',
			shortcut: '⌘C',
			action: () => navigator.clipboard.writeText('Simulated Copy'),
		},
		{ label: 'Paste', shortcut: '⌘V', action: () => alert('Paste triggered') },
		{ label: 'Select All', shortcut: '⌘A', action: () => {} },
	];

	const getViewMenu = (): MenuItem[] => [
		{ label: 'As Icons', disabled: activeAppName !== 'Finder', action: () => {} },
		{ label: 'As List', disabled: activeAppName !== 'Finder', action: () => {} },
		{ label: 'As Columns', disabled: activeAppName !== 'Finder', action: () => {} },
		{ type: 'separator' },
		{
			label: 'Enter Full Screen',
			shortcut: '⌃⌘F',
			action: () => {
				if (!document.fullscreenElement) {
					document.documentElement.requestFullscreen().catch(e => console.error(e));
				} else {
					document.exitFullscreen();
				}
			},
		},
	];

	const getWindowMenu = (): MenuItem[] => [
		{
			label: 'Minimize',
			shortcut: '⌘M',
			disabled: !activeWindow,
			action: () => activeWindow && minimizeWindow(activeWindow.id),
		},
		{ label: 'Zoom', disabled: !activeWindow, action: () => {} },
		{ type: 'separator' },
		{
			label: 'Bring All to Front',
			action: () => {
				// Bring all windows to front by updating z-indices?
				// For now, just re-focus the last one.
			},
		},
	];

	const getHelpMenu = (): MenuItem[] => [
		{
			label: `${activeAppName} Help`,
			action: () => alert(`Help for ${activeAppName} coming soon.`),
		},
	];

	// Map of menu IDs to their content generators
	const menus: { [key: string]: { label?: string; getItems: () => MenuItem[]; bold?: boolean } } = {
		apple: { getItems: getAppleMenu },
		app: { label: activeAppName, getItems: getAppMenu, bold: true },
		file: { label: 'File', getItems: getFileMenu },
		edit: { label: 'Edit', getItems: getEditMenu },
		view: { label: 'View', getItems: getViewMenu },
		window: { label: 'Window', getItems: getWindowMenu },
		help: { label: 'Help', getItems: getHelpMenu },
	};

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
							items={menus.apple.getItems()}
							isOpen={activeMenu === 'apple'}
							onClose={() => setActiveMenu(null)}
						/>
					</div>

					{/* Standard Menus */}
					{Object.keys(menus)
						.filter(key => key !== 'apple')
						.map(key => {
							const menu = menus[key];
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
				<div className="flex items-center gap-2.5 text-black dark:text-white">
					<button
						className={`w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70 ${isSpotlightOpen ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}
						aria-label="Search"
						onClick={() => setIsSpotlightOpen(!isSpotlightOpen)}
					>
						<i className="fas fa-search text-xs"></i>
					</button>
					<button
						className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70"
						aria-label="Wi-Fi"
					>
						<i className={`fas ${isWifi ? 'fa-wifi' : 'fa-signal'} text-xs`}></i>
					</button>
					{/* Battery */}
					<div className="flex items-center gap-px">
						<div className="relative flex items-center">
							{/* Battery Body */}
							<div className="w-[22px] h-[10px] border border-black/30 dark:border-white/30 rounded-[2.6px] p-px relative">
								{/* Battery Fill */}
								<div
									className={`h-full rounded-[1.5px] transition-all duration-300 ${
										batteryCharging ? 'bg-green-500' : ''
									}`}
									style={{
										width: `${batteryFillWidth}%`,
										backgroundColor: batteryCharging ? '#34c759' : batteryColor,
									}}
								></div>

								{/* Charging Bolt */}
								{batteryCharging && (
									<div className="absolute inset-0 flex items-center justify-center">
										<svg
											className="w-2.5 h-2.5 text-white drop-shadow-sm"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
										</svg>
									</div>
								)}
							</div>
							{/* Battery Terminal (Cap) */}
							<div className="w-[1.5px] h-[4px] bg-black/30 dark:bg-white/30 rounded-r-[1px] translate-x-[-0.5px]"></div>
						</div>
					</div>
					<button
						type="button"
						className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70 relative z-70 cursor-pointer"
						onClick={handleToggleControlCenter}
						aria-label="Control Center"
					>
						<i className="fas fa-sliders-h text-xs pointer-events-none"></i>
					</button>
					{/* Date and Time */}
					<DesktopClock />
				</div>
			</div>

			<ControlCenter />
			<Spotlight isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} />
		</>
	);
}
