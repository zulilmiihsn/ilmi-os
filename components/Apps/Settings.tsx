'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, ChevronLeft, Search, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import { useControlCenterStore } from '../../stores/controlCenter';
import { useNotificationsStore } from '../../stores/notifications';
import { triggerHaptic } from '../../utils/haptic';
import { subscribeFileSystemChanged } from '../../utils/fileSystem';
import { compressImageFile, subscribePhotosChanged } from '../../utils/photoStorage';
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
import { FocusView, NotificationsView, StorageView } from './Settings/SettingsSubViews';
import {
	computeStorageBreakdown,
	formatStorageSummary,
	type StorageBreakdown,
} from './Settings/storageMetrics';

type SettingsPane = 'root' | 'notifications' | 'focus' | 'storage';

const WALLPAPERS = [
	{ src: '/media/Wallpaper-desktop-1.webp', label: 'Big Sur' },
	{ src: '/media/Wallpaper-1.webp', label: 'Dark Stream' },
	{ src: 'linear-gradient(to right, #ff7e5f, #feb47b)', label: 'Sunset' },
	{ src: 'linear-gradient(to right, #4facfe, #00f2fe)', label: 'Ocean' },
	{ src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Plum' },
	{ src: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', label: 'Aurora' },
];

const PANE_TITLES: Record<SettingsPane, string> = {
	root: 'Settings',
	notifications: 'Notifications',
	focus: 'Focus',
	storage: 'Storage',
};

export default function Settings() {
	const { darkMode, toggleDarkMode, wallpaper, setWallpaper, notificationsEnabled } =
		useSettingsStore();
	const { focusMode, activeFocus } = useControlCenterStore();
	const notificationsCount = useNotificationsStore(state => state.notifications.length);

	const [activePane, setActivePane] = useState<SettingsPane>('root');
	const [searchQuery, setSearchQuery] = useState('');
	const [showAbout, setShowAbout] = useState(false);
	const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'done'>('idle');
	const [settingsError, setSettingsError] = useState<string | null>(null);
	const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown>(() =>
		computeStorageBreakdown()
	);

	const aboutRef = useRef<HTMLDivElement>(null);
	const wallpaperInputRef = useRef<HTMLInputElement>(null);
	useRestoreFocus(showAbout, aboutRef);
	useFocusTrap(showAbout, aboutRef);

	const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		return () => {
			if (updateTimer.current) clearTimeout(updateTimer.current);
		};
	}, []);

	const refreshStorage = useCallback(() => {
		setStorageBreakdown(computeStorageBreakdown());
	}, []);

	useEffect(() => {
		refreshStorage();
		const stopFs = subscribeFileSystemChanged(refreshStorage);
		const stopPhotos = subscribePhotosChanged(refreshStorage);
		return () => {
			stopFs();
			stopPhotos();
		};
	}, [refreshStorage]);

	const checkForUpdates = () => {
		if (updateState === 'checking') return;
		triggerHaptic('light');
		setUpdateState('checking');
		updateTimer.current = setTimeout(() => {
			updateTimer.current = null;
			setUpdateState('done');
		}, 1200);
	};

	const handleCustomWallpaperChange = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			setSettingsError('Please choose a valid image file for your wallpaper.');
			return;
		}
		setSettingsError(null);
		try {
			const compressed = await compressImageFile(file, 1440, 0.8);
			setWallpaper(compressed);
			refreshStorage();
		} catch (error) {
			setSettingsError(
				error instanceof Error ? error.message : 'Could not apply custom wallpaper.'
			);
		}
	};

	const isCustomWallpaper =
		wallpaper.startsWith('data:image/') || !WALLPAPERS.some(wp => wp.src === wallpaper);

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
	const storageSummary = formatStorageSummary(storageBreakdown);
	const notificationsSummary = notificationsEnabled
		? notificationsCount > 0
			? `${notificationsCount}`
			: 'On'
		: 'Off';
	const focusSummary = focusMode && activeFocus ? activeFocus : 'Off';

	return (
		<div
			className={`settings-app w-full h-full flex flex-col font-sans overflow-hidden select-none transition-colors duration-300 ${theme.bg}`}
		>
			<input
				ref={wallpaperInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				aria-label="Choose custom wallpaper image"
				onChange={e => {
					const file = e.target.files?.[0];
					if (file) void handleCustomWallpaperChange(file);
					e.target.value = '';
				}}
			/>

			{/* Header */}
			<div className={`pt-10 px-5 pb-2 shrink-0 ${theme.bg}`}>
				{activePane !== 'root' && (
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setActivePane('root');
						}}
						className="inline-flex items-center gap-0.5 text-ios-blue text-sm font-medium mb-1 active:opacity-70"
					>
						<ChevronLeft aria-hidden="true" size={16} />
						<span>Settings</span>
					</button>
				)}
				<h1 className="text-ios-large-title mb-3">{PANE_TITLES[activePane]}</h1>

				{activePane === 'root' && (
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
				)}

				{settingsError && (
					<div
						role="alert"
						className="mt-2.5 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs"
					>
						<div className="flex items-center gap-2 min-w-0">
							<AlertCircle aria-hidden="true" size={14} className="shrink-0" />
							<span className="truncate">{settingsError}</span>
						</div>
						<button
							type="button"
							onClick={() => setSettingsError(null)}
							aria-label="Dismiss error"
							className="p-0.5 rounded hover:bg-red-500/15 shrink-0"
						>
							<X aria-hidden="true" size={13} />
						</button>
					</div>
				)}
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto pt-2 pb-[max(env(safe-area-inset-bottom),4rem)]">
				{activePane === 'notifications' && <NotificationsView darkMode={darkMode} />}
				{activePane === 'focus' && <FocusView darkMode={darkMode} />}
				{activePane === 'storage' && (
					<StorageView
						darkMode={darkMode}
						breakdown={storageBreakdown}
						onRefresh={refreshStorage}
						onStorageError={setSettingsError}
					/>
				)}

				{activePane === 'root' && (
					<>
						{!q && <ProfileHeader darkMode={darkMode} onClick={() => setShowAbout(true)} />}

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
										value={notificationsSummary}
										darkMode={darkMode}
										onClick={() => setActivePane('notifications')}
									/>
								)}
								{matches('Focus') && (
									<ListItem
										label="Focus"
										iconClass="moon"
										iconColor="bg-ios-indigo"
										value={focusSummary}
										darkMode={darkMode}
										onClick={() => setActivePane('focus')}
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
										onClick={() => wallpaperInputRef.current?.click()}
									/>
								)}

								{/* Grid Area */}
								<div
									className={`p-4 pt-2 grid grid-cols-2 gap-3.5 ${darkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`}
								>
									{isCustomWallpaper && (
										<WallpaperOption
											src={wallpaper}
											label="Custom"
											active={true}
											onClick={() => wallpaperInputRef.current?.click()}
											darkMode={darkMode}
										/>
									)}
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
										onClick={() => setShowAbout(true)}
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
										onClick={() => {
											refreshStorage();
											setActivePane('storage');
										}}
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
					</>
				)}
			</div>

			{showAbout && <AboutDialog aboutRef={aboutRef} onClose={() => setShowAbout(false)} />}
		</div>
	);
}
