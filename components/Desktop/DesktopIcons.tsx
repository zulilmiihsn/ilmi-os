'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAppsStore } from '../../stores/apps';
import { isMacosApp } from '../../types';
import { useWindowsStore } from '../../stores/windows';
import { WINDOW } from '../../constants';
import type { WindowState } from '../../types';

export default function DesktopIcons() {
	const allApps = useAppsStore(state => state.apps);
	const apps = useMemo(
		() => allApps.filter(app => isMacosApp(app) && app.showOnDesktop),
		[allApps]
	);

	const launchApp = useAppsStore(state => state.launchApp);
	const windows = useWindowsStore(state => state.windows) as WindowState[];
	const openWindow = useWindowsStore(state => state.openWindow);
	const focusWindow = useWindowsStore(state => state.focusWindow);

	const [selectedId, setSelectedId] = useState<string | null>(null);

	function handleDoubleClick(app: (typeof apps)[number]) {
		launchApp(app.id);
		const existingWindow = windows.find(w => w.appId === app.id && !w.isMinimized);

		if (existingWindow) {
			focusWindow(existingWindow.id);
		} else {
			openWindow({
				title: app.name,
				appId: app.id,
				x: WINDOW.DEFAULT_X + Math.random() * 40,
				y: WINDOW.DEFAULT_Y + Math.random() * 40,
				width: WINDOW.DEFAULT_WIDTH,
				height: WINDOW.DEFAULT_HEIGHT,
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
						className={`
							pointer-events-auto
							w-[84px] h-[92px] 
							flex flex-col items-center justify-start gap-1 
							group cursor-default rounded-[4px]
							border border-transparent
							focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80
							${isSelected ? 'bg-white/20 border-white/10 backdrop-blur-sm' : 'hover:bg-white/10'}
						`}
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
						<div className="relative w-[54px] h-[54px] mt-2 filter drop-shadow-lg transition-transform duration-200 group-active:scale-95">
							{isSvgIcon ? (
								<Image
									src={app.icon}
									alt={app.name}
									fill
									className="object-contain"
									unoptimized
									sizes="64px"
									draggable={false}
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl text-white">
									<i className={`fas ${app.icon} text-2xl`}></i>
								</div>
							)}
						</div>
						<span
							className={`
								text-[13px] font-medium text-white text-center leading-tight
								px-1
								line-clamp-2
							`}
							style={{
								textShadow: '0 1px 3px rgba(0,0,0,0.8)',
							}}
						>
							{app.name}
						</span>
					</div>
				);
			})}
		</div>
	);
}
