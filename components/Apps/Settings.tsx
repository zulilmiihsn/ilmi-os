'use client';

import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';

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
	iconClass = 'fas fa-cog',
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

	return (
		<div
			className={`flex items-center group cursor-pointer ${darkMode ? 'active:bg-white/5' : 'active:bg-gray-100'} transition-colors select-none`}
			onClick={() => {
				if (onClick) {
					triggerHaptic('light');
					onClick();
				}
			}}
		>
			{/* Icon Column */}
			<div className="pl-4 pr-3 py-3">
				<div
					className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor} text-white shadow-xs shrink-0 text-sm`}
				>
					{icon ? icon : <i className={iconClass}></i>}
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
					{hasArrow && (
						<i
							className={`fas fa-chevron-right text-gray-300 dark:text-gray-600 text-xs`}
						></i>
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
		className={`w-[51px] h-[31px] rounded-full p-[2px] cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-[#34c759]' : darkMode ? 'bg-[#39393d]' : 'bg-[#e9e9ea]'}`}
		onClick={e => {
			e.stopPropagation();
			triggerHaptic('medium');
			onChange(!checked);
		}}
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
		className={`relative aspect-16/10 rounded-xl overflow-hidden transition-all duration-200 group border ${active ? 'ring-2 ring-[#007aff] ring-offset-2 border-transparent' : 'border-black/5 dark:border-white/10 hover:scale-[1.02]'} ${darkMode ? 'ring-offset-black' : 'ring-offset-[#f2f2f7]'}`}
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
			<div className="absolute top-2 right-2 bg-[#007aff] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md text-xs">
				<i className="fas fa-check"></i>
			</div>
		)}
	</button>
);

const ProfileHeader = ({ darkMode }: { darkMode: boolean }) => {
	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div className="flex items-center gap-4 px-4 py-3 mx-4 sm:mx-6 md:max-w-2xl md:mx-auto mb-6 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-xs cursor-pointer active:scale-[0.99] transition-all">
			<div className="relative shrink-0">
				<div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#007aff] to-[#5856d6] text-white text-xl font-bold shadow-md">
					U
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<h1 className={`text-lg font-semibold tracking-tight ${theme.text}`}>User</h1>
				<p className="text-xs text-gray-400 truncate">
					Apple ID, iCloud+, Media & Purchases
				</p>
			</div>
			<i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 text-xs"></i>
		</div>
	);
};

export default function Settings() {
	const { darkMode, toggleDarkMode, wallpaper, setWallpaper } = useSettingsStore();
	const [searchQuery, setSearchQuery] = useState('');

	const wallpapers = [
					{ src: '/media/Wallpaper-desktop-1.webp', label: 'Big Sur' },
					{ src: '/media/Wallpaper-1.webp', label: 'Dark Stream' },
		{ src: 'linear-gradient(to right, #ff7e5f, #feb47b)', label: 'Sunset' },
		{ src: 'linear-gradient(to right, #4facfe, #00f2fe)', label: 'Ocean' },
		{ src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Plum' },
		{ src: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', label: 'Aurora' },
	];

	const theme = darkMode ? THEME.dark : THEME.light;

	return (
		<div
			className={`w-full h-full flex flex-col font-sans overflow-hidden select-none transition-colors duration-300 ${theme.bg}`}
		>
			{/* Header */}
			<div className={`pt-10 px-5 pb-2 shrink-0 ${theme.bg}`}>
				<h1 className="text-3xl font-bold tracking-tight mb-3">Settings</h1>
				<div className="flex items-center rounded-xl px-3 py-2 border bg-[#e3e3e8]/70 dark:bg-[#1c1c1e] border-black/5 dark:border-white/10">
					<i className="fas fa-search text-gray-400 mr-2 text-xs"></i>
					<input
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
					/>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto pt-2 pb-16">
				<ProfileHeader darkMode={darkMode} />

				{/* Settings Controls */}
				<Section title="Appearance" darkMode={darkMode}>
					<ListItem
						label="Dark Mode"
						iconClass="fas fa-moon"
						iconColor="bg-[#5856D6]"
						hasArrow={false}
						darkMode={darkMode}
						showSeparator={true}
					>
						<Toggle checked={darkMode} onChange={toggleDarkMode} darkMode={darkMode} />
					</ListItem>
					<ListItem
						label="Notifications"
						iconClass="fas fa-bell"
						iconColor="bg-[#FF3B30]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Focus"
						iconClass="fas fa-moon"
						iconColor="bg-[#5856D6]"
						darkMode={darkMode}
						isLast
					/>
				</Section>

				{/* Wallpaper */}
				<Section title="Wallpaper" darkMode={darkMode}>
					<ListItem
						label="Choose a New Wallpaper"
						iconClass="fas fa-images"
						iconColor="bg-[#34C759]"
						hasArrow={true}
						darkMode={darkMode}
						showSeparator={false}
					/>

					{/* Grid Area */}
					<div
						className={`p-4 pt-2 grid grid-cols-2 gap-3.5 ${darkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`}
					>
						{wallpapers.map((wp, i) => (
							<WallpaperOption
								key={i}
								src={wp.src}
								label={wp.label}
								active={wallpaper === wp.src}
								onClick={() => setWallpaper(wp.src)}
								darkMode={darkMode}
							/>
						))}
					</div>
				</Section>

				{/* General */}
				<Section title="General" darkMode={darkMode}>
					<ListItem
						label="About"
						iconClass="fas fa-info-circle"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Software Update"
						iconClass="fas fa-gear"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
					/>
					<ListItem
						label="Storage"
						iconClass="fas fa-server"
						iconColor="bg-[#8E8E93]"
						darkMode={darkMode}
						isLast
					/>
				</Section>
			</div>
		</div>
	);
}
