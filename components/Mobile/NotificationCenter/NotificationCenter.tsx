'use client';

import React, { useState, useEffect, useRef, forwardRef, memo, useImperativeHandle } from 'react';
import Image from 'next/image';
import { useNotificationsStore } from '../../../stores/notifications';
import { useControlCenterStore } from '../../../stores/controlCenter';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';

interface NotificationCenterProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
}

const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(
	function NotificationCenter({ isOpen, onClose, onOpenApp }, ref) {
		const internalRef = useRef<HTMLDivElement>(null);
		useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

		const notifications = useNotificationsStore((state) => state.notifications);
		const dismissNotification = useNotificationsStore((state) => state.dismissNotification);
		const clearAllNotifications = useNotificationsStore((state) => state.clearAllNotifications);

		const flashlight = useControlCenterStore((state) => state.flashlight);
		const toggleFlashlight = useControlCenterStore((state) => state.toggleFlashlight);
		const wallpaper = useSettingsStore((state) => state.wallpaper);

		const [timeString, setTimeString] = useState('');
		const [dateString, setDateString] = useState('');

		// Swipe-up dismiss tracking
		const touchStartRef = useRef<{ y: number; active: boolean } | null>(null);

		useEffect(() => {
			const updateTime = () => {
				const now = new Date();
				setTimeString(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
				setDateString(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
			};
			updateTime();
			const timer = setInterval(updateTime, 1000);
			return () => clearInterval(timer);
		}, []);

		// Swipe up to dismiss handlers
		const handleTouchStart = (e: React.TouchEvent) => {
			if (!isOpen) return;
			touchStartRef.current = { y: e.touches[0].clientY, active: true };
		};

		const handleTouchMove = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !internalRef.current || !isOpen) return;
			const deltaY = touchStartRef.current.y - e.touches[0].clientY;
			if (deltaY > 0) {
				const translateY = Math.min(deltaY, window.innerHeight);
				internalRef.current.style.transition = 'none';
				internalRef.current.style.transform = `translate3d(0, -${translateY}px, 0)`;
			}
		};

		const handleTouchEnd = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !internalRef.current || !isOpen) return;
			const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
			touchStartRef.current = null;

			// Reset inline transform override
			internalRef.current.style.transition = '';
			internalRef.current.style.transform = '';

			if (deltaY > 80) {
				triggerHaptic('medium');
				onClose();
			}
		};

		return (
			<div
				ref={internalRef}
				className="ios-cover-sheet fixed inset-0 z-80 flex flex-col justify-between select-none overflow-hidden"
				style={{
					transform: isOpen ? 'translate3d(0, 0%, 0)' : 'translate3d(0, -100%, 0)',
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? 'auto' : 'none',
					transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease',
					willChange: 'transform, opacity',
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Authentic iOS Lockscreen Wallpaper Background */}
				<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
					<Image
						src={wallpaper || '/media/Wallpaper-desktop-1.jpg'}
						alt="Lockscreen Wallpaper"
						fill
						className="object-cover"
						priority
						unoptimized
					/>
					{/* Subtle iOS Depth Vignette */}
					<div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
				</div>

				{/* Top Status Bar & Clock Header */}
				<div className="w-full pt-14 pb-2 flex flex-col items-center justify-center shrink-0">
					{/* Date */}
					<div className="text-white/90 text-[18px] font-semibold tracking-normal mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
						{dateString}
					</div>

					{/* Time - iOS Authentic Display Font */}
					<div
						className="text-white font-bold text-[84px] tracking-normal leading-none drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]"
						style={{ fontVariantNumeric: 'tabular-nums' }}
					>
						{timeString}
					</div>
				</div>

				{/* Middle Notification Stack */}
				<div className="flex-1 w-full max-w-md mx-auto px-4 py-3 overflow-y-auto space-y-3">
					{notifications.length > 0 && (
						<>
							<div
								className="flex items-center justify-between px-1 pb-1 will-change-transform"
								style={{
									transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease',
									transform: isOpen ? 'translateY(0)' : 'translateY(-14px)',
									opacity: isOpen ? 1 : 0,
								}}
							>
								<span className="text-white/90 text-sm font-semibold tracking-wide drop-shadow-md">Notification Center</span>
								<button
									onClick={() => {
										triggerHaptic('light');
										clearAllNotifications();
									}}
									className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full backdrop-blur-md transition-colors"
								>
									Clear All
								</button>
							</div>

							{notifications.map((item, idx) => (
								<div
									key={item.id}
									onClick={() => {
										triggerHaptic('light');
										if (onOpenApp && item.appId) {
											onClose();
											onOpenApp(item.appId);
										}
									}}
									className="relative group bg-white/25 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-3.5 shadow-lg active:scale-[0.98] transition-transform cursor-pointer will-change-transform"
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
													<Image src={item.appIcon} alt={item.appName} width={20} height={20} className="w-full h-full object-cover" unoptimized />
												) : (
													<i className={`fas ${item.appIcon} text-xs text-white`}></i>
												)}
											</div>
											<span className="text-xs font-semibold text-white/90 uppercase tracking-wide">{item.appName}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-[11px] text-white/60 font-medium">{item.time}</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													triggerHaptic('light');
													dismissNotification(item.id);
												}}
												className="w-4 h-4 rounded-full bg-white/20 text-white/80 hover:bg-white/40 flex items-center justify-center text-[10px]"
												aria-label="Dismiss notification"
											>
												<i className="fas fa-times"></i>
											</button>
										</div>
									</div>
									<div className="text-sm font-semibold text-white tracking-tight mb-0.5">{item.title}</div>
									<div className="text-xs text-white/80 leading-relaxed line-clamp-2">{item.message}</div>
								</div>
							))}
						</>
					)}
				</div>

				{/* Bottom Controls Area (Pinned to corners like authentic iPhone Lock Screen) */}
				<div className="w-full relative pb-8 pt-4 px-8 flex flex-col items-center">
					<div className="w-full flex items-center justify-between mb-3 px-2">
						{/* Flashlight Shortcut Pod */}
						<button
							onClick={() => { triggerHaptic('medium'); toggleFlashlight(); }}
							className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-2xl border active:scale-90 transition-all duration-150 ${
								flashlight
									? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
									: 'bg-black/35 text-white border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-black/45'
							}`}
							aria-label="Toggle Flashlight"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
								<path d="M7 2v3l2 3v14h6V8l2-3V2H7zm5 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
							</svg>
						</button>

						{/* Camera Shortcut Pod */}
						<button
							onClick={() => { triggerHaptic('medium'); onClose(); if (onOpenApp) onOpenApp('camera'); }}
							className="w-14 h-14 rounded-full bg-black/35 text-white border border-white/20 flex items-center justify-center backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-black/45 active:scale-90 transition-all duration-150"
							aria-label="Open Camera"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
								<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
								<circle cx="12" cy="13" r="3" />
							</svg>
						</button>
					</div>

					{/* Home Indicator Pill */}
					<div
						onClick={() => { triggerHaptic('light'); onClose(); }}
						className="w-36 h-1 bg-white/70 rounded-full cursor-pointer hover:bg-white active:scale-95 transition-all"
					/>
				</div>
			</div>
		);
	}
);

export default memo(NotificationCenter);
