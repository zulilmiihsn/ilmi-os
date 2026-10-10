'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
	Bell,
	Check,
	ChevronRight,
	Cog,
	Images,
	Info,
	Moon,
	Search,
	Server,
	type LucideIcon,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import { loadFileSystem, formatFileSize } from '../../utils/fileSystem';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';

// Theme Configuration
const THEME = {
	light: {
		bg: 'bg-[#f2f2f7]',
		text: 'text-black',
		textSecondary: 'text-gray-400',
		sectionBg: 'bg-white border border-black/5',
		separator: 'border-gray-100',
	},
	dark: {
		bg: 'bg-black',
		text: 'text-white',
		textSecondary: 'text-gray-400',
		sectionBg: 'bg-[#1c1c1e] border border-white/10',
		separator: 'border-white/10',
	},
};

// Reusable Components
// Icon keys from ListItem data mapped to Lucide.
const SETTINGS_ICONS: Record<string, LucideIcon> = {
	'moon': Moon,
	'bell': Bell,
	'images': Images,
	'info-circle': Info,
	'gear': Cog,
	'cog': Cog,
	'server': Server,
};

const Section = ({
	children,
	title,
	darkMode,
}: {
	children: React.ReactNode;
	title?: string;
	darkMode: boolean;
}) => {
	const theme = darkMode ? THEME.dark : THEME.light;
	return (
		<div className="mb-6 mx-4 sm:mx-6 md:max-w-2xl md:mx-auto">
			{title && (
				<h2
					className={`text-xs uppercase mb-2 pl-4 font-semibold tracking-wider transition-colors ${theme.textSecondary}`}
				>
					{title}
				</h2>
			)}
			<div className={`${theme.sectionBg} rounded-2xl overflow-hidden shadow-xs transition-colors`}>
				{children}
			</div>
		</div>
	);
};

const ListItem = ({
	icon,
	label,
	value,
	hasArrow = true,
	iconColor = 'bg-gray-400',
	iconClass = 'cog',
	isLast = false,
	onClick,
	children,
	darkMode,
	showSeparator = true,
}: {
	icon?: React.ReactNode;
	label: string;
	value?: string;
	hasArrow?: boolean;
	iconColor?: string;
	iconClass?: string;
	isLast?: boolean;
	onClick?: () => void;
	children?: React.ReactNode;
	darkMode: boolean;
	showSeparator?: boolean;
}) => {
	const theme = darkMode ? THEME.dark : THEME.light;
	const ItemIcon = !icon && iconClass ? (SETTINGS_ICONS[iconClass] ?? null) : null;

		return (
		<div
			className={`flex items-center group ${onClick ? 'cursor-pointer' : ''} ${darkMode ? 'active:bg-white/5' : 'active:bg-gray-100'} transition-colors select-none`}
			onClick={() => {
				if (onClick) {
					triggerHaptic('light');
					onClick();
				}
			}}
			onKeyDown={e => {
				if (onClick && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					triggerHaptic('light');
					onClick();
				}
			}}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
		>
			{/* Icon Column */}
			<div className="pl-4 pr-3 py-3">
				<div
					className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor} text-white shadow-xs shrink-0 text-sm`}
				>
						{icon ? icon : ItemIcon ? <ItemIcon aria-hidden="true" size={14} /> : null}
				</div>
			</div>

			{/* Content Column */}
			<div
				className={`flex-1 flex items-center justify-between py-3 pr-4 border-b ${!isLast && showSeparator ? theme.separator : 'border-transparent'} transition-colors`}
			>
				<span className={`text-[15px] ${theme.text} font-normal truncate pr-2 tracking-tight`}>
					{label}
				</span>

				<div className="flex items-center gap-2">
					{children}
					{value && (
						<span className={`${theme.textSecondary} text-sm`}>{value}</span>
					)}
					{hasArrow && onClick && (
						<ChevronRight
							aria-hidden="true"
							size={12}
							className={`text-gray-300 dark:text-gray-600`}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

const Toggle = ({
	checked,
	onChange,
	darkMode,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	darkMode: boolean;
}) => (
	<div
		className={`w-[51px] h-[31px] rounded-full p-[2px] cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-ios-green' : darkMode ? 'bg-[#39393d]' : 'bg-[#e9e9ea]'}`}
		onClick={e => {
			e.stopPropagation();
			triggerHaptic('medium');
			onChange(!checked);
		}}
		onKeyDown={e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				triggerHaptic('medium');
				onChange(!checked);
			}
		}}
		role="switch"
		aria-checked={checked}
		tabIndex={0}
	>
		<div
			className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
		/>
	</div>
);

const WallpaperOption = ({
	src,
	label,
	active,
	onClick,
	darkMode,
}: {
	src: string;
	label: string;
	active: boolean;
	onClick: () => void;
	darkMode: boolean;
}) => (
	<button
		className={`relative aspect-[16/10] rounded-xl overflow-hidden transition-all duration-200 group border ${active ? 'ring-2 ring-ios-blue ring-offset-2 border-transparent' : 'border-black/5 dark:border-white/10 hover:scale-[1.02]'} ${darkMode ? 'ring-offset-black' : 'ring-offset-[#f2f2f7]'}`}
		onClick={() => {
			triggerHaptic('light');
			onClick();
		}}
	>
		{src.startsWith('/') ? (
			// eslint-disable-next-line @next/next/no-img-element
			<img src={src} alt={label} className="w-full h-full object-cover" />
		) : (
			<div className="w-full h-full" style={{ background: src }}></div>
		)}

		<div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
			<span className="text-white text-xs font-medium drop-shadow-md px-1">{label}</span>
		</div>

		{active && (
			<div className="absolute top-2 right-2 bg-ios-blue text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md text-xs">
				<Check aria-hidden="true" size={12} />
			</div>
		)}
	</button>
);

const ProfileHeader = ({ darkMode }: { darkMode: boolean }) => {
	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div className="flex items-center gap-4 px-4 py-3 mx-4 sm:mx-6 md:max-w-2xl md:mx-auto mb-6 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-xs cursor-pointer active:scale-[0.99] transition-all">
			<div className="relative shrink-0">
				<div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-ios-blue to-ios-indigo text-white text-xl font-bold shadow-md">
					U
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<h1 className={`text-lg font-semibold tracking-tight ${theme.text}`}>User</h1>
				<p className="text-xs text-gray-400 truncate">
					Apple ID, iCloud+, Media & Purchases
				</p>
			</div>
			<ChevronRight aria-hidden="true" size={12} className="text-gray-300 dark:text-gray-600" />
		</div>
	);
};

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

	const wallpapers = [
					{ src: '/media/Wallpaper-desktop-1.webp', label: 'Big Sur' },
					{ src: '/media/Wallpaper-1.webp', label: 'Dark Stream' },
		{ src: 'linear-gradient(to right, #ff7e5f, #feb47b)', label: 'Sunset' },
		{ src: 'linear-gradient(to right, #4facfe, #00f2fe)', label: 'Ocean' },
		{ src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Plum' },
		{ src: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', label: 'Aurora' },
	];

	const q = searchQuery.trim().toLowerCase();
	const matches = (label: string) => label.toLowerCase().includes(q);
	const showAppearance =
		'appearance'.includes(q) ||
		matches('Dark Mode') ||
		matches('Notifications') ||
		matches('Focus');
	const matchingWallpapers = wallpapers.filter(wp => matches(wp.label));
	const showWallpaper =
		'wallpaper'.includes(q) || matches('Choose a New Wallpaper') || matchingWallpapers.length > 0;
	const showGeneral =
		'general'.includes(q) ||
		matches('About') ||
		matches('Software Update') ||
		matches('Storage');

	const theme = darkMode ? THEME.dark : THEME.light;

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

			{/* About dialog */}
			{showAbout && (
				<div
					className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
					onClick={() => setShowAbout(false)}
				>
					<div
						ref={aboutRef}
						onKeyDown={e => {
							if (e.key === 'Escape') setShowAbout(false);
						}}
						onClick={e => e.stopPropagation()}
						role="dialog"
						aria-label="About iLmi"
						className="w-72 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
					>
						<div className="px-4 py-5 text-center border-b border-black/5 dark:border-white/10">
							<h2 className="text-lg font-bold">iLmi</h2>
							<p className="text-xs text-gray-400 mt-1">Version 0.0.1</p>
							<p className="text-xs text-gray-400 mt-2">
								An iOS &amp; macOS simulator portfolio.
							</p>
						</div>
						<button
							onClick={() => setShowAbout(false)}
							autoFocus
							className="w-full py-3 text-sm text-ios-blue font-semibold active:bg-black/5 dark:active:bg-white/10 transition-colors"
						>
							OK
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
