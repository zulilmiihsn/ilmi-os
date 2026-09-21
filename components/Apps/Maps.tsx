'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';

export default function Maps() {
	const { darkMode } = useSettingsStore();
	const [searchFocused, setSearchFocused] = useState(false);
	const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

	return (
		<div
			className={`w-full h-full relative overflow-hidden font-sans select-none ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}
		>
			{/* Map Background */}
			<div className="absolute inset-0 z-0">
				<Image
					src="/media/apple_maps_dark_3d_background.webp"
					alt="Map Background"
					fill
					className="object-cover scale-110"
					priority
					quality={75}
					draggable={false}
				/>

				{!darkMode && (
					<div className="absolute inset-0 bg-white/35 z-0 backdrop-grayscale-[0.4] pointer-events-none"></div>
				)}

				<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
			</div>

			{/* Floating Action Island (Top Right) */}
			<div className="absolute top-14 right-4 z-10 flex flex-col gap-2.5">
				{/* 3D/2D Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						setViewMode(viewMode === '3D' ? '2D' : '3D');
					}}
					className="w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15"
				>
					<span className="font-bold text-xs tracking-tight text-[#007aff]">
						{viewMode}
					</span>
				</button>

				{/* Location / Center */}
				<button
					onClick={() => triggerHaptic('light')}
					className="w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 text-[#007aff]"
				>
					<i className="fas fa-location-arrow text-xs"></i>
				</button>

				{/* Compass */}
				<button
					onClick={() => triggerHaptic('light')}
					className="w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 text-[#ff3b30]"
				>
					<i className="fas fa-compass text-sm"></i>
				</button>
			</div>

			{/* Bottom Liquid Glass Sheet */}
			<div
				className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${searchFocused ? 'h-[85%]' : 'h-auto'}`}
			>
				<div
					className={`backdrop-blur-2xl w-full rounded-t-3xl pb-10 pt-4 px-4 shadow-2xl border-t transition-colors ${
						darkMode
							? 'bg-[#1c1c1e]/90 border-white/15 text-white'
							: 'bg-white/90 border-black/5 text-black'
					}`}
				>
					{/* Drag Pill */}
					<div className="w-9 h-1 bg-gray-400/50 rounded-full mx-auto mb-3"></div>

					{/* Search Capsule */}
					<div className="relative mb-4">
						<div className="flex items-center rounded-2xl px-3.5 py-2.5 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
							<i className="fas fa-search text-gray-400 mr-2 text-xs"></i>
							<input
								type="text"
								className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
								placeholder="Search Maps"
								onFocus={() => setSearchFocused(true)}
								onBlur={() => setSearchFocused(false)}
							/>
							<i className="fas fa-microphone text-gray-400 text-xs ml-2"></i>
						</div>
					</div>

					{/* Suggestions */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
							Favorites & Recents
						</h3>

						<div className="grid grid-cols-2 gap-2.5">
							<div
								onClick={() => triggerHaptic('light')}
								className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
							>
								<div className="w-8 h-8 rounded-full bg-[#007aff] text-white flex items-center justify-center text-xs">
									<i className="fas fa-home"></i>
								</div>
								<div>
									<div className="text-xs font-semibold">Home</div>
									<div className="text-[10px] text-gray-400">12 min</div>
								</div>
							</div>

							<div
								onClick={() => triggerHaptic('light')}
								className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
							>
								<div className="w-8 h-8 rounded-full bg-[#ff9500] text-white flex items-center justify-center text-xs">
									<i className="fas fa-briefcase"></i>
								</div>
								<div>
									<div className="text-xs font-semibold">Work</div>
									<div className="text-[10px] text-gray-400">25 min</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
