'use client';

import React, { useState, useEffect, useRef, forwardRef, memo, useImperativeHandle } from 'react';
import Image from 'next/image';
import { useNotificationsStore } from '../../../stores/notifications';
import { useControlCenterStore } from '../../../stores/controlCenter';
import { useSettingsStore, isImageWallpaper } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import NotificationList from './NotificationList';

interface NotificationCenterProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
}

const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(
	function NotificationCenter({ isOpen, onClose, onOpenApp }, ref) {
		const internalRef = useRef<HTMLDivElement>(null);
		useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

		const notifications = useNotificationsStore(state => state.notifications);
		const dismissNotification = useNotificationsStore(state => state.dismissNotification);
		const clearAllNotifications = useNotificationsStore(state => state.clearAllNotifications);

		const flashlight = useControlCenterStore(state => state.flashlight);
		const toggleFlashlight = useControlCenterStore(state => state.toggleFlashlight);
		const wallpaper = useSettingsStore(state => state.wallpaper);

		const [timeString, setTimeString] = useState('');
		const [dateString, setDateString] = useState('');

		// Swipe-up dismiss tracking
		const touchStartRef = useRef<{ y: number; active: boolean } | null>(null);

		useEffect(() => {
			const updateTime = () => {
				const now = new Date();
				setTimeString(
					`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
				);
				setDateString(
					now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
				);
			};
			updateTime();
			const timer = setInterval(updateTime, 1000);
			return () => clearInterval(timer);
		}, []);

		// Swipe up to dismiss handlers
		const handleTouchStart = (e: React.TouchEvent) => {
			if (!isOpen) return;
			const touch = e.touches[0];
			if (!touch) return;
			touchStartRef.current = { y: touch.clientY, active: true };
		};

		const handleTouchMove = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !internalRef.current || !isOpen) return;
			const touch = e.touches[0];
			if (!touch) return;
			const deltaY = touchStartRef.current.y - touch.clientY;
			if (deltaY > 0) {
				const translateY = Math.min(deltaY, window.innerHeight);
				internalRef.current.style.transition = 'none';
				internalRef.current.style.transform = `translate3d(0, -${translateY}px, 0)`;
			}
		};

		const handleTouchEnd = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !internalRef.current || !isOpen) return;
			const touch = e.changedTouches[0];
			if (!touch) return;
			const deltaY = touchStartRef.current.y - touch.clientY;
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
					// Keep the exit animation, then remove the closed panel from
					// keyboard focus and assistive tech via delayed visibility.
					visibility: isOpen ? 'visible' : 'hidden',
					transition:
						'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease, visibility 0s linear ' +
						(isOpen ? '0s' : '0.38s'),
					willChange: 'transform, opacity',
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Authentic iOS Lockscreen Wallpaper Background */}
				<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
					{isImageWallpaper(wallpaper || '/media/Wallpaper-desktop-1.webp') ? (
						<Image
							src={wallpaper || '/media/Wallpaper-desktop-1.webp'}
							alt="Lockscreen Wallpaper"
							fill
							className="object-cover"
							priority
							unoptimized
						/>
					) : (
						<div className="w-full h-full" style={{ background: wallpaper }} />
					)}
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
				<NotificationList
					notifications={notifications}
					isOpen={isOpen}
					onClose={onClose}
					onOpenApp={onOpenApp}
					onDismiss={dismissNotification}
					onClearAll={clearAllNotifications}
				/>

				{/* Bottom Controls Area (Pinned to corners like authentic iPhone Lock Screen) */}
				<div className="w-full relative pb-8 pt-4 px-8 flex flex-col items-center">
					<div className="w-full flex items-center justify-between mb-3 px-2">
						{/* Flashlight Shortcut Pod */}
						<button
							onClick={() => {
								triggerHaptic('medium');
								toggleFlashlight();
							}}
							className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-2xl border active:scale-90 transition-all duration-150 ${
								flashlight
									? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
									: 'bg-black/35 text-white border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-black/45'
							}`}
							aria-label="Toggle Flashlight"
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-6 h-6"
							>
								<path d="M7 2v3l2 3v14h6V8l2-3V2H7zm5 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
							</svg>
						</button>

						{/* Camera Shortcut Pod */}
						<button
							onClick={() => {
								triggerHaptic('medium');
								onClose();
								if (onOpenApp) onOpenApp('camera');
							}}
							className="w-14 h-14 rounded-full bg-black/35 text-white border border-white/20 flex items-center justify-center backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-black/45 active:scale-90 transition-all duration-150"
							aria-label="Open Camera"
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-6 h-6"
							>
								<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
								<circle cx="12" cy="13" r="3" />
							</svg>
						</button>
					</div>

					{/* Home Indicator Pill */}
					<div
						onClick={() => {
							triggerHaptic('light');
							onClose();
						}}
						className="w-36 h-1 bg-white/70 rounded-full cursor-pointer hover:bg-white active:scale-95 transition-all"
					/>
				</div>
			</div>
		);
	}
);

export default memo(NotificationCenter);
