'use client';

import React from 'react';
import { Bell, X } from 'lucide-react';
import Image from 'next/image';
import type { NotificationItem } from '../../../stores/notifications';
import { triggerHaptic } from '../../../utils/haptic';

interface NotificationListProps {
	notifications: NotificationItem[];
	isOpen: boolean;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
	onDismiss: (id: string) => void;
	onClearAll: () => void;
}

export default function NotificationList({
	notifications,
	isOpen,
	onClose,
	onOpenApp,
	onDismiss,
	onClearAll,
}: NotificationListProps) {
	if (notifications.length === 0) {
		return <div className="flex-1 w-full max-w-md mx-auto px-4 py-3 overflow-y-auto space-y-3" />;
	}

	const openNotificationApp = (appId?: string) => {
		triggerHaptic('light');
		if (onOpenApp && appId) {
			onClose();
			onOpenApp(appId);
		}
	};

	return (
		<div className="flex-1 w-full max-w-md mx-auto px-4 py-3 overflow-y-auto space-y-3">
			<div
				className="flex items-center justify-between px-1 pb-1 will-change-transform"
				style={{
					transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease',
					transform: isOpen ? 'translateY(0)' : 'translateY(-14px)',
					opacity: isOpen ? 1 : 0,
				}}
			>
				<span className="text-white/90 text-sm font-semibold tracking-wide drop-shadow-md">
					Notification Center
				</span>
				<button
					onClick={() => {
						triggerHaptic('light');
						onClearAll();
					}}
					className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full backdrop-blur-md transition-colors"
				>
					Clear All
				</button>
			</div>

			{notifications.map((item, idx) => (
				<div
					key={item.id}
					role="button"
					tabIndex={0}
					aria-label={`Open ${item.appName}: ${item.title}`}
					onClick={() => openNotificationApp(item.appId)}
					onKeyDown={e => {
						if (e.key !== 'Enter' && e.key !== ' ') return;
						e.preventDefault();
						openNotificationApp(item.appId);
					}}
					className="relative group bg-white/25 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-3.5 shadow-lg active:scale-[0.98] transition-transform cursor-pointer will-change-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
					style={{
						transition: 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease',
						transitionDelay: isOpen ? `${Math.min(180, 40 + idx * 35)}ms` : '0ms',
						transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-18px) scale(0.95)',
						opacity: isOpen ? 1 : 0,
					}}
				>
					<div className="flex items-center justify-between mb-1.5">
						<div className="flex items-center gap-2">
							<div className="w-5 h-5 relative rounded-md overflow-hidden bg-white/20 flex items-center justify-center">
								{item.appIcon.startsWith('/') ? (
									<Image
										src={item.appIcon}
										alt={item.appName}
										width={20}
										height={20}
										className="w-full h-full object-cover"
										unoptimized
									/>
								) : (
									<Bell aria-hidden="true" size={12} className="text-white" />
								)}
							</div>
							<span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
								{item.appName}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-[11px] text-white/60 font-medium">{item.time}</span>
							<button
								onClick={e => {
									e.stopPropagation();
									triggerHaptic('light');
									onDismiss(item.id);
								}}
								className="w-4 h-4 rounded-full bg-white/20 text-white/80 hover:bg-white/40 flex items-center justify-center text-[10px]"
								aria-label="Dismiss notification"
							>
								<X aria-hidden="true" size={10} />
							</button>
						</div>
					</div>
					<div className="text-sm font-semibold text-white tracking-tight mb-0.5">{item.title}</div>
					<div className="text-xs text-white/80 leading-relaxed line-clamp-2">{item.message}</div>
				</div>
			))}
		</div>
	);
}
