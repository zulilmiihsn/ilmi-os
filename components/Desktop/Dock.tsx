'use client';

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { AppWindow } from 'lucide-react';
import { useAppsStore } from '../../stores/apps';
import { isMacosApp } from '../../types';
import { useWindowsStore } from '../../stores/windows';
import type { WindowState } from '../../types';
import { WINDOW } from '../../constants';

// Configuration for dock physics
const BASE_SIZE = 48; // Base size of icons in px
const MAX_SCALE = 1.6; // Maximum scale factor (1.6x)
const INFLUENCE_RADIUS = 150; // Distance of effect in px

function Dock() {
	const allApps = useAppsStore(state => state.apps);
	const apps = useMemo(() => allApps.filter(app => isMacosApp(app) && app.showInDock), [allApps]);

	const isAppRunning = useAppsStore(state => state.isAppRunning);
	const launchApp = useAppsStore(state => state.launchApp);
	const windows = useWindowsStore(state => state.windows) as WindowState[];
	const openWindow = useWindowsStore(state => state.openWindow);
	const focusWindow = useWindowsStore(state => state.focusWindow);
	const updateWindow = useWindowsStore(state => state.updateWindow);

	const dockRef = useRef<HTMLDivElement>(null);
	const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);
	const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reset refs array when apps change
	useEffect(() => {
		iconRefs.current = iconRefs.current.slice(0, apps.length);
	}, [apps.length]);

	useEffect(() => {
		return () => {
			if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
		};
	}, []);

	function handleAppClick(app: (typeof apps)[number], index: number) {
		launchApp(app.id);
		const iconEl = iconRefs.current[index];
		const existingWindow =
			windows.find(w => w.appId === app.id && !w.isMinimized) ??
			windows.find(w => w.appId === app.id);

		// Bounce the icon when launching a new window (macOS cue); state-driven so
		// React re-renders from opening the window never strip the class.
		if (!existingWindow) {
			setBouncingAppId(app.id);
			if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
			bounceTimerRef.current = setTimeout(() => setBouncingAppId(null), 650);
		}

		// Get icon position for animation
		let originRect;
		if (iconEl) {
			const rect = iconEl.getBoundingClientRect();
			originRect = {
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			};
		}

		if (existingWindow) {
			if (existingWindow.isMinimized) {
				updateWindow(existingWindow.id, { isMinimized: false });
			}
			focusWindow(existingWindow.id);
		} else {
			openWindow({
				title: app.name,
				appId: app.id,
				x: WINDOW.DEFAULT_X + Math.random() * 40,
				y: WINDOW.DEFAULT_Y + Math.random() * 40,
				width: app.defaultSize?.width ?? WINDOW.DEFAULT_WIDTH,
				height: app.defaultSize?.height ?? WINDOW.DEFAULT_HEIGHT,
				isMaximized: false,
				isMinimized: false,
				originRect,
			});
		}
	}

	// Physics Animation Logic
	useEffect(() => {
		const dock = dockRef.current;
		if (!dock) return;

		let rafId: number;

		const handleMouseMove = (e: MouseEvent) => {
			// Use RAF to throttle updates to screen refresh rate
			if (rafId) cancelAnimationFrame(rafId);

			rafId = requestAnimationFrame(() => {
				const mouseX = e.clientX;

				iconRefs.current.forEach(icon => {
					if (!icon) return;

					const rect = icon.getBoundingClientRect();
					const iconCenterX = rect.left + rect.width / 2;
					const distance = mouseX - iconCenterX;

					// Gaussian-like curve for magnification
					// If distance is within influence radius, calculate scale
					let scale = 1;
					if (Math.abs(distance) < INFLUENCE_RADIUS) {
						// Calculate how "close" we are (0 to 1)
						const closeness = 1 - Math.abs(distance) / INFLUENCE_RADIUS;
						// Use sine easing for smoother feel
						const eased = Math.sin((closeness * Math.PI) / 2);
						scale = 1 + (MAX_SCALE - 1) * eased;
					}

					// Apply styles directly; items-end keeps icons anchored to the dock baseline
					// while expanding cleanly upwards without stretching the tray height.
					const size = BASE_SIZE * scale;
					icon.style.width = `${size}px`;
					icon.style.height = `${size}px`;
				});
			});
		};

		const handleMouseLeave = () => {
			if (rafId) cancelAnimationFrame(rafId);

			// Reset all to base size (smooth return via .macos-dock:not(:hover) .dock-item)
			iconRefs.current.forEach(icon => {
				if (!icon) return;
				icon.style.width = `${BASE_SIZE}px`;
				icon.style.height = `${BASE_SIZE}px`;
			});
		};

		dock.addEventListener('mousemove', handleMouseMove);
		dock.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			dock.removeEventListener('mousemove', handleMouseMove);
			dock.removeEventListener('mouseleave', handleMouseLeave);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, []);

	return (
		<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
			<div
				ref={dockRef}
				className="macos-dock h-[68px] flex items-end justify-center gap-3 px-4 py-3 bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl"
			>
				{apps.map((app, index) => {
					const isSvgIcon = app.icon.startsWith('/');
					return (
						<button
							key={app.id}
							type="button"
							data-app-id={app.id}
							ref={el => {
								iconRefs.current[index] = el;
							}}
							className={`dock-item group relative rounded-2xl flex items-center justify-center will-change-transform ${
								bouncingAppId === app.id ? 'dock-bounce' : ''
							}`}
							style={{ width: `${BASE_SIZE}px`, height: `${BASE_SIZE}px` }}
							onClick={() => handleAppClick(app, index)}
							aria-label={isAppRunning(app.id) ? `Focus ${app.name}` : `Launch ${app.name}`}
						>
							{/* Name tooltip like macOS: CSS-only so magnification stays re-render free. */}
							<span
								aria-hidden="true"
								className="dock-tooltip pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/90 dark:bg-[#1e1e20]/90 text-gray-900 dark:text-white border border-black/10 dark:border-white/15 backdrop-blur-xl px-2.5 py-1 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-300"
							>
								{app.name}
							</span>
							{isSvgIcon ? (
								<Image
									src={app.icon}
									alt={app.name}
									fill
									className="object-contain p-1"
									unoptimized
									sizes="96px"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl text-white">
									<AppWindow aria-hidden="true" size={24} />
								</div>
							)}

							{/* Running indicator dot */}
							{isAppRunning(app.id) && (
								<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black/70 dark:bg-white/85 rounded-full shadow-sm"></div>
							)}
						</button>
					);
				})}
			</div>
			{/* Invisible hover area below dock */}
			<div className="absolute top-full left-0 w-full h-4" />
		</div>
	);
}

export default memo(Dock);
