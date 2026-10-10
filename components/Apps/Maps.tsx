'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import { Briefcase, Compass, House, Mic, Navigation, Search } from 'lucide-react';

export default function Maps() {
	const { darkMode } = useSettingsStore();
	const [searchFocused, setSearchFocused] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
	const [showUserDot, setShowUserDot] = useState(false);

	const q = searchQuery.trim().toLowerCase();
	const showHome = q === '' || 'home'.includes(q);
	const showWork = q === '' || 'work'.includes(q);

	const resetView = () => {
		triggerHaptic('light');
		setSearchQuery('');
		setSearchFocused(false);
		setShowUserDot(false);
	};

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
					className={`object-cover transition-transform duration-500 ${viewMode === '3D' ? 'scale-110' : 'scale-100'}`}
					priority
					quality={75}
					draggable={false}
				/>

				{!darkMode && (
					<div className="absolute inset-0 bg-white/35 z-0 backdrop-grayscale-[0.4] pointer-events-none"></div>
				)}

				<div
					className={`absolute inset-0 bg-gradient-to-b pointer-events-none transition-all duration-500 ${
						viewMode === '3D' ? 'from-black/20 via-transparent to-black/40' : 'from-black/10 via-transparent to-black/20'
					}`}
				/>
			</div>

			{/* User location dot */}
			{showUserDot && (
				<div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
					<div className="w-24 h-24 rounded-full bg-ios-blue/15" />
					<div className="absolute w-5 h-5 rounded-full bg-ios-blue border-[3px] border-white shadow-lg" />
				</div>
			)}

			{/* Floating Action Island (Top Right) */}
			<div className="absolute top-14 right-4 z-10 flex flex-col gap-2.5">
				{/* 3D/2D Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						setViewMode(viewMode === '3D' ? '2D' : '3D');
					}}
					className="relative w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 after:absolute after:-inset-0.5 after:content-['']"
				>
					<span className="font-bold text-xs tracking-tight text-ios-blue">
						{viewMode}
					</span>
				</button>

				{/* Location / Center */}
				<button
					onClick={() => {
						triggerHaptic('light');
						setShowUserDot(prev => !prev);
					}}
					aria-label="Show my location"
					aria-pressed={showUserDot}
					className="relative w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 after:absolute after:-inset-0.5 after:content-[''] text-ios-blue"
				>
					<Navigation aria-hidden="true" size={12} />
				</button>

				{/* Compass */}
				<button
					onClick={resetView}
					aria-label="Reset view"
					className="relative w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 after:absolute after:-inset-0.5 after:content-[''] text-ios-red"
				>
					<Compass aria-hidden="true" size={14} />
				</button>
			</div>

			{/* Bottom Liquid Glass Sheet */}
			<div
				className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${searchFocused ? 'h-[85%]' : 'h-auto'}`}
			>
				<div
					className={`backdrop-blur-2xl w-full rounded-t-3xl pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-4 px-4 shadow-2xl border-t transition-colors ${
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
							<Search aria-hidden="true" size={12} className="text-gray-400 mr-2" />
							<input
								type="text"
								className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
								placeholder="Search Maps"
								aria-label="Search Maps"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								onFocus={() => setSearchFocused(true)}
								onBlur={() => setSearchFocused(false)}
							/>
							<Mic aria-hidden="true" size={12} className="text-gray-400 ml-2" />
						</div>
					</div>

					{/* Suggestions */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
							Favorites & Recents
						</h3>

						<div className="grid grid-cols-2 gap-2.5">
							{showHome && (
							<div
								onClick={() => {
									triggerHaptic('light');
									setShowUserDot(true);
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										triggerHaptic('light');
										setShowUserDot(true);
									}
								}}
								role="button"
								tabIndex={0}
								aria-label="Show Home on map"
								className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
							>
								<div className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center text-xs">
									<House aria-hidden="true" size={14} />
								</div>
								<div>
									<div className="text-xs font-semibold">Home</div>
									<div className="text-[10px] text-gray-400">12 min</div>
								</div>
							</div>
							)}

							{showWork && (
							<div
								onClick={() => {
									triggerHaptic('light');
									setShowUserDot(true);
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										triggerHaptic('light');
										setShowUserDot(true);
									}
								}}
								role="button"
								tabIndex={0}
								aria-label="Show Work on map"
								className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
							>
								<div className="w-8 h-8 rounded-full bg-ios-orange text-white flex items-center justify-center text-xs">
									<Briefcase aria-hidden="true" size={14} />
								</div>
								<div>
									<div className="text-xs font-semibold">Work</div>
									<div className="text-[10px] text-gray-400">25 min</div>
								</div>
							</div>
							)}
							{!showHome && !showWork && (
								<p className="col-span-2 text-xs text-gray-400 px-1 py-2">No results</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
