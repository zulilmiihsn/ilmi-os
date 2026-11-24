'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import { loadFileSystem, formatFileSize } from '../../utils/fileSystem';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';
import {
	SETTINGS_THEME,
	Section,
	ListItem,
	Toggle,
	WallpaperOption,
	ProfileHeader,
} from './Settings/SettingsPrimitives';
import { AboutDialog } from './Settings/AboutDialog';

const WALLPAPERS = [
	{ src: '/media/Wallpaper-desktop-1.webp', label: 'Big Sur' },
	{ src: '/media/Wallpaper-1.webp', label: 'Dark Stream' },
	{ src: 'linear-gradient(to right, #ff7e5f, #feb47b)', label: 'Sunset' },
	{ src: 'linear-gradient(to right, #4facfe, #00f2fe)', label: 'Ocean' },
	{ src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Plum' },
	{ src: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', label: 'Aurora' },
];

export default function Settings() {
	const { darkMode, toggleDarkMode, wallpaper, setWallpaper } = useSettingsStore();
	const [searchQuery, setSearchQuery] = useState('');
	const [showAbout, setShowAbout] = useState(false);
	const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'done'>('idle');
	const aboutRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(showAbout, aboutRef);
	useFocusTrap(showAbout, aboutRef);
	const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		return () => {
			if (updateTimer.current) clearTimeout(updateTimer.current);
		};
	}, []);

	// Real on-disk usage (same store Finder/Files read).
	const storageSummary = useMemo(() => {
		try {
			const items = loadFileSystem().items ?? [];
			const total = items.reduce((sum, i) => sum + (i.size ?? 0), 0);
			return `${items.length} items · ${formatFileSize(total)}`;
		} catch {
			return 'Unavailable';
		}
	}, []);

	const checkForUpdates = () => {
		if (updateState === 'checking') return;
		triggerHaptic('light');
		setUpdateState('checking');
		updateTimer.current = setTimeout(() => {
			updateTimer.current = null;
			setUpdateState('done');
		}, 1200);
	};

	const q = searchQuery.trim().toLowerCase();
	const matches = (label: string) => label.toLowerCase().includes(q);
	const showAppearance =
		'appearance'.includes(q) ||
		matches('Dark Mode') ||
		matches('Notifications') ||
		matches('Focus');
	const matchingWallpapers = WALLPAPERS.filter(wp => matches(wp.label));
	const showWallpaper =
		'wallpaper'.includes(q) || matches('Choose a New Wallpaper') || matchingWallpapers.length > 0;
	const showGeneral =
		'general'.includes(q) || matches('About') || matches('Software Update') || matches('Storage');

	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;

	return (
		<div
			className={`w-full h-full flex flex-col font-sans overflow-hidden select-none transition-colors duration-300 ${theme.bg}`}
		>
			{/* Header */}
			<div className={`pt-10 px-5 pb-2 shrink-0 ${theme.bg}`}>
				<h1 className="text-ios-large-title mb-3">Settings</h1>
				<div className="flex items-center rounded-xl px-3 py-2 border bg-[#e3e3e8]/70 dark:bg-[#1c1c1e] border-black/5 dark:border-white/10">
					<Search aria-hidden="true" size={12} className="text-gray-400 mr-2" />
					<input
						type="text"
						placeholder="Search"
						aria-label="Search settings"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
					/>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto pt-2 pb-[max(env(safe-area-inset-bottom),4rem)]">
				{!q && <ProfileHeader darkMode={darkMode} />}

				{/* Settings Controls */}
				{showAppearance && (
					<Section title="Appearance" darkMode={darkMode}>
						{matches('Dark Mode') && (
							<ListItem
								label="Dark Mode"
								iconClass="moon"
								iconColor="bg-ios-indigo"
								hasArrow={false}
								darkMode={darkMode}
								showSeparator={true}
							>
								<Toggle checked={darkMode} onChange={toggleDarkMode} darkMode={darkMode} />
							</ListItem>
						)}
						{matches('Notifications') && (
							<ListItem
								label="Notifications"
								iconClass="bell"
								iconColor="bg-ios-red"
								darkMode={darkMode}
							/>
						)}
						{matches('Focus') && (
							<ListItem
								label="Focus"
								iconClass="moon"
								iconColor="bg-ios-indigo"
								darkMode={darkMode}
								isLast
							/>
						)}
					</Section>
				)}

				{/* Wallpaper */}
				{showWallpaper && (
					<Section title="Wallpaper" darkMode={darkMode}>
						{matches('Choose a New Wallpaper') && (
							<ListItem
								label="Choose a New Wallpaper"
								iconClass="images"
								iconColor="bg-ios-green"
								hasArrow={true}
								darkMode={darkMode}
								showSeparator={false}
							/>
						)}

						{/* Grid Area */}
						<div
							className={`p-4 pt-2 grid grid-cols-2 gap-3.5 ${darkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`}
						>
							{matchingWallpapers.map(wp => (
								<WallpaperOption
									key={wp.src}
									src={wp.src}
									label={wp.label}
									active={wallpaper === wp.src}
									onClick={() => setWallpaper(wp.src)}
									darkMode={darkMode}
								/>
							))}
						</div>
					</Section>
				)}

				{/* General */}
				{showGeneral && (
					<Section title="General" darkMode={darkMode}>
						{matches('About') && (
							<ListItem
								label="About"
								iconClass="info-circle"
								iconColor="bg-ios-gray"
								darkMode={darkMode}
								onClick={() => {
									triggerHaptic('light');
									setShowAbout(true);
								}}
							/>
						)}
						{matches('Software Update') && (
							<ListItem
								label="Software Update"
								iconClass="gear"
								iconColor="bg-ios-gray"
								darkMode={darkMode}
								value={
									updateState === 'checking'
										? 'Checking…'
										: updateState === 'done'
											? 'Up to date'
											: undefined
								}
								onClick={checkForUpdates}
							/>
						)}
						{matches('Storage') && (
							<ListItem
								label="Storage"
								iconClass="server"
								iconColor="bg-ios-gray"
								darkMode={darkMode}
								value={storageSummary}
								isLast
							/>
						)}
					</Section>
				)}

				{q && !showAppearance && !showWallpaper && !showGeneral && (
					<div className="px-5 py-8 text-center text-sm text-gray-400">
						No Results for &ldquo;{searchQuery.trim()}&rdquo;
					</div>
				)}
			</div>

			{showAbout && <AboutDialog aboutRef={aboutRef} onClose={() => setShowAbout(false)} />}
		</div>
	);
}
