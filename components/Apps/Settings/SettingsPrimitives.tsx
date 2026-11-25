'use client';

import React from 'react';
import {
	Bell,
	Bluetooth,
	Check,
	ChevronRight,
	Cog,
	Folder,
	Images,
	Info,
	Moon,
	Server,
	StickyNote,
	SunMoon,
	Wifi,
	type LucideIcon,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';
import { isImageWallpaper } from '../../../stores/settings';

export const SETTINGS_THEME = {
	light: {
		bg: 'bg-[#f2f2f7]',
		text: 'text-black',
		textSecondary: 'text-gray-500',
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

const SETTINGS_ICONS: Record<string, LucideIcon> = {
	moon: Moon,
	'sun-moon': SunMoon,
	wifi: Wifi,
	bluetooth: Bluetooth,
	bell: Bell,
	images: Images,
	folder: Folder,
	'sticky-note': StickyNote,
	'info-circle': Info,
	gear: Cog,
	cog: Cog,
	server: Server,
};

export const Section = ({
	children,
	title,
	darkMode,
}: {
	children: React.ReactNode;
	title?: string;
	darkMode: boolean;
}) => {
	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;
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

export const ListItem = ({
	icon,
	label,
	subtitle,
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
	subtitle?: string;
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
	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;
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
				className={`flex-1 flex items-center justify-between py-3 pr-4 border-b min-w-0 ${!isLast && showSeparator ? theme.separator : 'border-transparent'} transition-colors`}
			>
				<div className="min-w-0 pr-2">
					<span className={`block text-[15px] ${theme.text} font-normal truncate tracking-tight`}>
						{label}
					</span>
					{subtitle && (
						<span className={`block text-xs ${theme.textSecondary} mt-0.5 leading-snug`}>
							{subtitle}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{children}
					{value && <span className={`${theme.textSecondary} text-sm`}>{value}</span>}
					{hasArrow && onClick && (
						<ChevronRight
							aria-hidden="true"
							size={12}
							className="text-gray-300 dark:text-gray-600"
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export const Toggle = ({
	checked,
	onChange,
	darkMode,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	darkMode: boolean;
	label?: string;
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
		aria-label={label}
		tabIndex={0}
	>
		<div
			className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
		/>
	</div>
);

export const WallpaperOption = ({
	src,
	label,
	active,
	onClick,
}: {
	src: string;
	label: string;
	active: boolean;
	onClick: () => void;
	darkMode?: boolean;
}) => (
	<button
		type="button"
		className={`relative aspect-[16/10] rounded-xl overflow-hidden transition-all duration-200 group border ${active ? 'ring-2 ring-ios-blue ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e] border-transparent' : 'border-black/5 dark:border-white/10 hover:scale-[1.02]'}`}
		onClick={() => {
			triggerHaptic('light');
			onClick();
		}}
	>
		{isImageWallpaper(src) ? (
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

export const ProfileHeader = ({
	darkMode,
	onClick,
}: {
	darkMode: boolean;
	onClick?: () => void;
}) => {
	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;

	return (
		<button
			type="button"
			onClick={() => {
				if (onClick) {
					triggerHaptic('light');
					onClick();
				}
			}}
			className="w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-full md:max-w-2xl mx-4 sm:mx-6 md:mx-auto mb-6 flex items-center gap-4 px-4 py-3 text-left rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
		>
			<div className="relative shrink-0">
				<div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-ios-blue to-ios-indigo text-white text-xl font-bold shadow-md">
					U
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<h2 className={`text-lg font-semibold tracking-tight ${theme.text}`}>User</h2>
				<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
					Apple ID, iCloud+, Media &amp; Purchases
				</p>
			</div>
			<ChevronRight aria-hidden="true" size={12} className="text-gray-300 dark:text-gray-600" />
		</button>
	);
};
