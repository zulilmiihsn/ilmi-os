'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AppWindow } from 'lucide-react';
import { useAppsStore } from '../../stores/apps';
import { isMacosApp } from '../../types';
import { useWindowsStore } from '../../stores/windows';
import { WINDOW } from '../../constants';
import type { WindowState } from '../../types';

interface DesktopIconsProps {
	selectedId?: string | null;
	onSelectId?: (id: string | null) => void;
}

export default function DesktopIcons({
	selectedId: controlledSelectedId,
	onSelectId,
}: DesktopIconsProps = {}) {
	const allApps = useAppsStore(state => state.apps);
	const apps = useMemo(
		() => allApps.filter(app => isMacosApp(app) && app.showOnDesktop),
		[allApps]
	);

	const launchApp = useAppsStore(state => state.launchApp);
	const windows = useWindowsStore(state => state.windows) as WindowState[];
	const openWindow = useWindowsStore(state => state.openWindow);
	const focusWindow = useWindowsStore(state => state.focusWindow);
	const updateWindow = useWindowsStore(state => state.updateWindow);

	const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
	const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
	const setSelectedId = onSelectId ?? setInternalSelectedId;

	function handleDoubleClick(app: (typeof apps)[number]) {
		launchApp(app.id);
		const existingWindow =
			windows.find(w => w.appId === app.id && !w.isMinimized) ??
			windows.find(w => w.appId === app.id);

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
			});
		}
		setSelectedId(null);
	}

	return (
		<div
			className="absolute inset-0 pointer-events-none z-0 p-4 pt-10 grid grid-flow-col gap-4 content-start items-start w-fit h-full"
			style={{ gridTemplateRows: 'repeat(auto-fill, 100px)' }}
		>
			{apps.map(app => {
				const isSvgIcon = app.icon.startsWith('/');
				const isSelected = selectedId === app.id;

				return (
					<div
						key={app.id}
						role="button"
						tabIndex={0}
						aria-label={`Open ${app.name}`}
						className="pointer-events-auto w-[84px] h-[92px] flex flex-col items-center justify-start gap-1 group cursor-default rounded-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
						onClick={e => {
							e.stopPropagation();
							setSelectedId(app.id);
						}}
						onDoubleClick={e => {
							e.stopPropagation();
							handleDoubleClick(app);
						}}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								e.stopPropagation();
								handleDoubleClick(app);
							}
						}}
					>
						<div
							className={`relative w-[60px] h-[60px] mt-1 p-1 rounded-lg border transition-all duration-150 group-active:scale-95 ${
								isSelected
									? 'bg-black/25 border-white/30 backdrop-blur-sm'
									: 'border-transparent group-hover:bg-white/10'
							}`}
						>
							<div className="relative w-full h-full filter drop-shadow-lg">
								{isSvgIcon ? (
									<Image
										src={app.icon}
										alt={app.name}
										fill
										className="object-contain"
										priority
										unoptimized
										sizes="64px"
										draggable={false}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl text-white">
										<AppWindow aria-hidden="true" size={24} />
									</div>
								)}
							</div>
						</div>
						<span
							className={`text-[12px] font-medium text-white text-center leading-tight px-1.5 py-0.5 rounded line-clamp-2 transition-colors ${
								isSelected ? 'bg-ios-blue' : ''
							}`}
							style={
								isSelected
									? undefined
									: {
											textShadow: '0 1px 3px rgba(0,0,0,0.85)',
										}
							}
						>
							{app.name}
						</span>
					</div>
				);
			})}
		</div>
	);
}
