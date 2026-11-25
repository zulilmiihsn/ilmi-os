'use client';

import React, { useState } from 'react';
import { Bell, Briefcase, Moon, Sparkles, Trash2, User, X } from 'lucide-react';
import { useControlCenterStore } from '../../../stores/controlCenter';
import { useNotificationsStore } from '../../../stores/notifications';
import { useSettingsStore } from '../../../stores/settings';
import { formatFileSize } from '../../../utils/fileSystem';
import { savePhotos } from '../../../utils/photoStorage';
import { triggerHaptic } from '../../../utils/haptic';
import { ListItem, Section, SETTINGS_THEME, Toggle } from './SettingsPrimitives';
import type { StorageBreakdown } from './storageMetrics';

export type FocusProfile = 'Do Not Disturb' | 'Work' | 'Personal' | 'Sleep';

const FOCUS_PROFILES: {
	id: FocusProfile;
	description: string;
	iconColor: string;
	icon: React.ReactNode;
}[] = [
	{
		id: 'Do Not Disturb',
		description: 'Silence alerts and notifications while active.',
		iconColor: 'bg-ios-indigo',
		icon: <Moon aria-hidden="true" size={14} />,
	},
	{
		id: 'Work',
		description: 'Keep focus on coding, mail, and calendar events.',
		iconColor: 'bg-ios-blue',
		icon: <Briefcase aria-hidden="true" size={14} />,
	},
	{
		id: 'Personal',
		description: 'Only allow personal messages and reminders.',
		iconColor: 'bg-ios-green',
		icon: <User aria-hidden="true" size={14} />,
	},
	{
		id: 'Sleep',
		description: 'Minimize distractions for rest.',
		iconColor: 'bg-[#30b0c7]',
		icon: <Sparkles aria-hidden="true" size={14} />,
	},
];

export function NotificationsView({ darkMode }: { darkMode: boolean }) {
	const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
	const { notifications, dismissNotification, clearAllNotifications, addNotification } =
		useNotificationsStore();
	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;

	const sendTestNotification = () => {
		triggerHaptic('light');
		addNotification({
			appId: 'settings',
			appName: 'Settings',
			appIcon: '/media/Settings.webp',
			title: 'Test Notification',
			message: 'Notifications are active and synced with Notification Center.',
			time: 'now',
			unread: true,
		});
	};

	return (
		<>
			<Section title="Delivery" darkMode={darkMode}>
				<ListItem
					label="Allow Notifications"
					iconClass="bell"
					iconColor="bg-ios-red"
					hasArrow={false}
					darkMode={darkMode}
					isLast
				>
					<Toggle
						checked={notificationsEnabled}
						onChange={setNotificationsEnabled}
						darkMode={darkMode}
						label="Allow Notifications"
					/>
				</ListItem>
			</Section>

			<Section title={`Recent (${notifications.length})`} darkMode={darkMode}>
				<div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/10">
					<button
						type="button"
						onClick={sendTestNotification}
						disabled={!notificationsEnabled}
						className="px-3 py-1.5 rounded-full bg-ios-blue text-white text-xs font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
					>
						Send Test Notification
					</button>
					{notifications.length > 0 && (
						<button
							type="button"
							onClick={() => {
								triggerHaptic('medium');
								clearAllNotifications();
							}}
							className="text-xs font-medium text-ios-red hover:underline active:opacity-70"
						>
							Clear All
						</button>
					)}
				</div>

				{notifications.length === 0 ? (
					<div className="px-4 py-8 text-center">
						<Bell
							aria-hidden="true"
							className="w-6 h-6 mx-auto mb-2 text-gray-500 dark:text-gray-400"
						/>
						<p className="text-xs text-gray-500 dark:text-gray-400">No pending notifications.</p>
					</div>
				) : (
					<ul className="divide-y divide-black/5 dark:divide-white/10">
						{notifications.map(item => (
							<li key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className={`text-sm font-medium truncate ${theme.text}`}>
											{item.title}
										</span>
										<span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
											{item.time}
										</span>
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
										{item.message}
									</p>
								</div>
								<button
									type="button"
									onClick={() => dismissNotification(item.id)}
									aria-label={`Dismiss ${item.title}`}
									className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
								>
									<X aria-hidden="true" size={14} />
								</button>
							</li>
						))}
					</ul>
				)}
			</Section>
		</>
	);
}

export function FocusView({ darkMode }: { darkMode: boolean }) {
	const { focusMode, activeFocus, setActiveFocus } = useControlCenterStore();

	return (
		<>
			<Section title="Active Focus" darkMode={darkMode}>
				{FOCUS_PROFILES.map((profile, idx) => {
					const isOn = focusMode && activeFocus === profile.id;
					return (
						<ListItem
							key={profile.id}
							label={profile.id}
							subtitle={profile.description}
							icon={profile.icon}
							iconColor={profile.iconColor}
							hasArrow={false}
							darkMode={darkMode}
							isLast={idx === FOCUS_PROFILES.length - 1}
						>
							<Toggle
								checked={isOn}
								onChange={checked => setActiveFocus(checked ? profile.id : null)}
								darkMode={darkMode}
								label={profile.id}
							/>
						</ListItem>
					);
				})}
			</Section>
			<p className="px-8 md:max-w-2xl md:mx-auto text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
				{focusMode && activeFocus
					? `${activeFocus} is currently enabled and synced with Control Center.`
					: 'Choose a Focus profile to silence distractions. Syncs live with Control Center.'}
			</p>
		</>
	);
}

const STORAGE_CATEGORY_ICONS: Record<string, string> = {
	files: 'folder',
	photos: 'images',
	notes: 'sticky-note',
	other: 'server',
};

export function StorageView({
	darkMode,
	breakdown,
	onRefresh,
	onStorageError,
}: {
	darkMode: boolean;
	breakdown: StorageBreakdown;
	onRefresh: () => void;
	onStorageError: (msg: string) => void;
}) {
	const [confirmClearPhotos, setConfirmClearPhotos] = useState(false);
	const theme = darkMode ? SETTINGS_THEME.dark : SETTINGS_THEME.light;
	const usedPct = Math.min(100, (breakdown.totalBytes / breakdown.budgetBytes) * 100);
	const photoCategory = breakdown.categories.find(c => c.id === 'photos');

	const handleClearPhotos = () => {
		const res = savePhotos([]);
		if (!res.ok) {
			onStorageError(res.message);
			return;
		}
		setConfirmClearPhotos(false);
		onRefresh();
	};

	const openApp = (appId: string) => {
		triggerHaptic('light');
		window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: appId }));
	};

	return (
		<>
			<Section title="Browser Storage" darkMode={darkMode}>
				<div className="p-4">
					<div className="flex items-baseline justify-between mb-2">
						<span className={`text-sm font-semibold ${theme.text}`}>iLmi Local Storage</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{formatFileSize(breakdown.totalBytes)} of {formatFileSize(breakdown.budgetBytes)} Used
						</span>
					</div>

					{/* Apple-style segmented usage bar */}
					<div
						className="w-full h-3 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/10"
						aria-label={`Storage usage ${usedPct.toFixed(1)} percent`}
					>
						{breakdown.categories.map(cat => {
							if (cat.bytes <= 0) return null;
							const widthPct = Math.max(2, (cat.bytes / breakdown.budgetBytes) * 100);
							return (
								<div
									key={cat.id}
									className={`${cat.colorClass} h-full transition-all duration-300`}
									style={{ width: `${widthPct}%` }}
									title={`${cat.label}: ${formatFileSize(cat.bytes)}`}
								/>
							);
						})}
					</div>

					{/* Legend */}
					<div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
						{breakdown.categories.map(cat => (
							<div
								key={cat.id}
								className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400"
							>
								<span className={`w-2 h-2 rounded-full ${cat.colorClass}`} />
								<span>{cat.label}</span>
							</div>
						))}
					</div>
				</div>
			</Section>

			<Section title="Apps & Data" darkMode={darkMode}>
				{breakdown.categories.map((cat, idx) => (
					<ListItem
						key={cat.id}
						label={cat.label}
						value={`${cat.itemCount} · ${formatFileSize(cat.bytes)}`}
						iconColor={cat.colorClass}
						iconClass={STORAGE_CATEGORY_ICONS[cat.id] ?? 'server'}
						hasArrow={Boolean(cat.appId)}
						darkMode={darkMode}
						isLast={idx === breakdown.categories.length - 1}
						onClick={cat.appId ? () => openApp(cat.appId as string) : undefined}
					/>
				))}
			</Section>

			{photoCategory && photoCategory.itemCount > 0 && (
				<Section title="Manage Media" darkMode={darkMode}>
					<div className="px-4 py-3 flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className={`text-sm font-medium ${theme.text}`}>
								Saved Camera &amp; Gallery Photos
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{photoCategory.itemCount} photo(s) using {formatFileSize(photoCategory.bytes)}
							</p>
						</div>
						{confirmClearPhotos ? (
							<div className="flex items-center gap-2 shrink-0">
								<button
									type="button"
									onClick={() => setConfirmClearPhotos(false)}
									className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleClearPhotos}
									className="px-2.5 py-1 rounded-lg text-xs font-medium bg-ios-red text-white active:scale-95"
								>
									Confirm Clear
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setConfirmClearPhotos(true)}
								className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 text-ios-red text-xs font-medium hover:bg-red-500/15 active:scale-95 shrink-0"
							>
								<Trash2 aria-hidden="true" size={12} />
								<span>Clear Photos</span>
							</button>
						)}
					</div>
				</Section>
			)}
		</>
	);
}
