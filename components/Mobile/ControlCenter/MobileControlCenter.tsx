'use client';

import React, { useState, useRef, useCallback, forwardRef, memo, useImperativeHandle } from 'react';
import { useControlCenterStore } from '../../../stores/controlCenter';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';

interface MobileControlCenterProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
}

// Vertical Liquid Glass Capsule Slider (iOS 26 Style)
interface VerticalSliderProps {
	value: number;
	onChange: (val: number) => void;
	icon: 'sun' | 'speaker';
	label: string;
}

const VerticalSlider = ({ value, onChange, icon, label }: VerticalSliderProps) => {
	const sliderRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const updateFromEvent = useCallback(
		(clientY: number) => {
			if (!sliderRef.current) return;
			const rect = sliderRef.current.getBoundingClientRect();
			const offsetY = clientY - rect.top;
			const clamped = Math.max(0, Math.min(rect.height, offsetY));
			const percentage = Math.round(100 - (clamped / rect.height) * 100);
			onChange(percentage);
		},
		[onChange]
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}
		setIsDragging(true);
		updateFromEvent(e.clientY);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		e.stopPropagation();
		updateFromEvent(e.clientY);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		e.stopPropagation();
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {}
		setIsDragging(false);
	};

	const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const step = 5;
		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			e.preventDefault();
			e.stopPropagation();
			onChange(Math.min(100, Math.round(value + step)));
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			e.preventDefault();
			e.stopPropagation();
			onChange(Math.max(0, Math.round(value - step)));
		} else if (e.key === 'Home') {
			e.preventDefault();
			e.stopPropagation();
			onChange(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			e.stopPropagation();
			onChange(100);
		}
	};

	return (
		<div
			ref={sliderRef}
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-orientation="vertical"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(value)}
			className="ios-vertical-slider relative w-full h-[156px] bg-white/10 rounded-full overflow-hidden cursor-pointer touch-none select-none border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.25)] flex flex-col justify-end active:scale-[0.97] transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerCancel}
			onTouchStart={e => e.stopPropagation()}
			onTouchMove={e => e.stopPropagation()}
			onTouchEnd={e => e.stopPropagation()}
			onKeyDown={handleSliderKeyDown}
		>
			{/* Liquid Fill Level */}
			<div
				className="w-full bg-white transition-[height] duration-75 ease-out rounded-b-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"
				style={{ height: `${value}%` }}
			/>

			{/* Icon Centered at Bottom */}
			<div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
				{icon === 'sun' ? (
					<svg
						width="30"
						height="30"
						viewBox="0 0 24 24"
						fill="currentColor"
						className={`transition-colors drop-shadow-sm ${value > 45 ? 'text-[#ffcc00]' : 'text-white'}`}
					>
						<circle cx="12" cy="12" r="4.5" />
						<path
							d="M12 1.5v2.5M12 20v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M1.5 12H4M20 12h2.5M6.3 17.7l-1.8 1.8M19.5 4.5l-1.8 1.8"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
						/>
					</svg>
				) : (
					<svg
						width="30"
						height="30"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={`transition-colors drop-shadow-sm ${value > 0 ? 'text-black' : 'text-white'}`}
					>
						{value === 0 ? (
							<>
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
								<line x1="23" y1="9" x2="17" y2="15" />
								<line x1="17" y1="9" x2="23" y2="15" />
							</>
						) : (
							<>
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
								<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
								{value > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
							</>
						)}
					</svg>
				)}
			</div>
			<span className="sr-only">{label}</span>
		</div>
	);
};

const MobileControlCenter = forwardRef<HTMLDivElement, MobileControlCenterProps>(
	function MobileControlCenter({ isOpen, onClose, onOpenApp }, ref) {
		const internalRef = useRef<HTMLDivElement>(null);
		useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

		const {
			wifi,
			bluetooth,
			airdrop,
			airplaneMode,
			flashlight,
			orientationLock,
			silentMode,
			activeFocus,
			brightness,
			volume,
			toggleWifi,
			toggleBluetooth,
			toggleAirdrop,
			toggleAirplaneMode,
			toggleFlashlight,
			toggleOrientationLock,
			toggleSilentMode,
			setActiveFocus,
			setBrightness,
			setVolume,
		} = useControlCenterStore();

		const { darkMode, toggleDarkMode } = useSettingsStore();

		// Music playback state
		const [isPlaying, setIsPlaying] = useState(false);
		const [lowPowerMode, setLowPowerMode] = useState(false);
		const [flipDegree, setFlipDegree] = useState(0);

		// Swipe-up dismiss tracking
		const touchStartRef = useRef<{ y: number; active: boolean } | null>(null);

		const handleTouchStart = (e: React.TouchEvent) => {
			if (!isOpen) return;
			const target = e.target as HTMLElement | null;
			if (target?.closest('.ios-vertical-slider, button, input')) return;
			touchStartRef.current = { y: e.touches[0].clientY, active: true };
		};

		const handleTouchEnd = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !isOpen) return;
			const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
			touchStartRef.current = null;

			// Swipe up to dismiss (only if swiped UP by > 80px outside interactive controls)
			if (deltaY > 80) {
				triggerHaptic('medium');
				onClose();
			}
		};

		// 3D Flip Focus Cycle
		const handleFocusCycle = () => {
			triggerHaptic('medium');
			setFlipDegree(prev => prev + 360);

			if (!activeFocus) {
				setActiveFocus('Do Not Disturb');
			} else if (activeFocus === 'Do Not Disturb') {
				setActiveFocus('Work');
			} else if (activeFocus === 'Work') {
				setActiveFocus('Personal');
			} else if (activeFocus === 'Personal') {
				setActiveFocus('Sleep');
			} else {
				setActiveFocus(null);
			}
		};

		const getFocusInfo = () => {
			if (activeFocus === 'Do Not Disturb') {
				return {
					label: 'Do Not Disturb',
					icon: 'fas fa-moon',
					bg: 'bg-[#5856d6]',
					shadow: 'shadow-[0_0_18px_rgba(88,86,214,0.6)]',
					border: 'border-white/30',
				};
			}
			if (activeFocus === 'Work') {
				return {
					label: 'Work',
					icon: 'fas fa-briefcase',
					bg: 'bg-[#007aff]',
					shadow: 'shadow-[0_0_18px_rgba(0,122,255,0.6)]',
					border: 'border-white/30',
				};
			}
			if (activeFocus === 'Personal') {
				return {
					label: 'Personal',
					icon: 'fas fa-user',
					bg: 'bg-[#ff9500]',
					shadow: 'shadow-[0_0_18px_rgba(255,149,0,0.6)]',
					border: 'border-white/30',
				};
			}
			if (activeFocus === 'Sleep') {
				return {
					label: 'Sleep',
					icon: 'fas fa-bed',
					bg: 'bg-[#34c759]',
					shadow: 'shadow-[0_0_18px_rgba(52,199,89,0.6)]',
					border: 'border-white/30',
				};
			}
			return {
				label: 'Focus',
				icon: 'fas fa-moon',
				bg: 'bg-white/10',
				shadow: 'shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
				border: 'border-white/20',
			};
		};

		const focusInfo = getFocusInfo();

		return (
			<div
				ref={internalRef}
				onClick={e => {
					if (e.target === e.currentTarget) {
						triggerHaptic('light');
						onClose();
					}
				}}
				className="ios-control-center fixed inset-0 z-90 flex flex-col justify-between p-4 pt-10 select-none overflow-y-auto"
				style={{
					transform: isOpen ? 'translate3d(0, 0, 0)' : 'translate3d(0, -100%, 0)',
					visibility: isOpen ? 'visible' : 'hidden',
					pointerEvents: isOpen ? 'auto' : 'none',
					transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), visibility 0.35s',
					willChange: 'transform',
				}}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
			>
				{/* Dedicated Frosted Backdrop (Eliminates Browser GPU Composite Flash) */}
				<div className="fixed inset-0 -z-10 bg-black/45 backdrop-blur-[50px] saturate-[190%] pointer-events-none" />

				<div className="w-full max-w-[375px] mx-auto space-y-3.5 pb-6">
					{/* Top Header: + Add Control | Active Status Pill | Power Button */}

					{/* Row 1: 2x2 Connectivity Bento + 2x2 Now Playing Bento */}
					<div className="grid grid-cols-2 gap-3.5">
						{/* Connectivity Module (Super-Curved iOS Squircle Pod) */}
						<div className="bg-white/10 p-3.5 rounded-[38px] border border-white/20 flex items-center justify-center aspect-square shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_0_rgba(0,0,0,0.25)]">
							{/* 4 Big Circular Buttons inside Connectivity */}
							<div className="grid grid-cols-2 gap-2.5 w-full">
								{/* 1. Airplane Mode (Top-Left: Bold Horizontal Plane) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleAirplaneMode();
									}}
									className={`w-full aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.2)] ${
										airplaneMode
											? 'bg-[#007aff] text-white border-white/30 shadow-[0_0_18px_rgba(0,122,255,0.7)]'
											: 'bg-white/10 text-white border-white/20'
									}`}
									aria-label="Airplane Mode"
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="currentColor"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinejoin="round"
										strokeLinecap="round"
										style={{ transform: 'rotate(90deg)' }}
									>
										<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
									</svg>
								</button>

								{/* 2. AirDrop (Top-Right: Authentic Apple AirDrop 300-deg Concentric Spherical Beacon) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleAirdrop();
									}}
									className={`w-full aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.2)] ${
										airdrop && !airplaneMode
											? 'bg-[#007aff] text-white border-white/30 shadow-[0_0_18px_rgba(0,122,255,0.7)]'
											: 'bg-white/10 text-white border-white/20'
									}`}
									aria-label="AirDrop"
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
										<path d="M8.46 15.54a5 5 0 1 1 7.08 0" />
										<path d="M5.99 18.01a8.5 8.5 0 1 1 12.02 0" />
									</svg>
								</button>

								{/* 3. Wi-Fi (Bottom-Left: 3 Concentric Waves) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleWifi();
									}}
									className={`w-full aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.2)] ${
										wifi && !airplaneMode
											? 'bg-[#007aff] text-white border-white/30 shadow-[0_0_18px_rgba(0,122,255,0.7)]'
											: 'bg-white/10 text-white border-white/20'
									}`}
									aria-label="Wi-Fi"
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M5 12.55a11 11 0 0 1 14.08 0" />
										<path d="M1.42 9a16 16 0 0 1 21.16 0" />
										<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
										<circle cx="12" cy="20" r="1.5" fill="currentColor" />
									</svg>
								</button>

								{/* 4. Bluetooth (Bottom-Right: Large Single Button) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleBluetooth();
									}}
									className={`w-full aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.2)] ${
										bluetooth
											? 'bg-[#007aff] text-white border-white/30 shadow-[0_0_18px_rgba(0,122,255,0.7)]'
											: 'bg-white/10 text-white border-white/20'
									}`}
									aria-label="Bluetooth"
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
									</svg>
								</button>
							</div>
						</div>

						{/* Music / Now Playing Module (1:1 Pixel-Perfect iOS 18 Squircle Pod) */}
						<div className="bg-white/10 p-3.5 rounded-[38px] border border-white/20 flex flex-col justify-between aspect-square shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_0_rgba(0,0,0,0.25)]">
							{/* Top header row: Glass Artwork Squircle & AirPlay Icon */}
							<div className="flex items-start justify-between">
								{/* Frosted Album Artwork Placeholder */}
								<div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]" />

								{/* AirPlay Audio Circular Disc */}
								<button
									onClick={() => triggerHaptic('light')}
									className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-90 transition-transform"
									aria-label="AirPlay"
								>
									<svg
										width="22"
										height="22"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.4"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
										<polygon points="12 15 17 21 7 21 12 15" fill="currentColor" />
									</svg>
								</button>
							</div>

							{/* Title: Not Playing */}
							<div className="px-1">
								<div className="text-[13px] font-semibold text-white/95 tracking-tight drop-shadow-sm">
									Not Playing
								</div>
							</div>

							{/* Player controls: Fixed Bounding Boxes (Zero Layout Shift) & Big Bold Glyphs */}
							<div className="flex items-center justify-center gap-5 text-white pb-1 select-none">
								{/* Previous Track */}
								<button
									onClick={() => triggerHaptic('light')}
									className="w-10 h-10 flex items-center justify-center text-white/45 hover:text-white active:scale-90 transition-transform"
									aria-label="Previous Track"
								>
									<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
										<polygon points="11 19 2 12 11 5 11 19" />
										<polygon points="22 19 13 12 22 5 22 19" />
									</svg>
								</button>

								{/* Play / Pause Standalone Glyph (Fixed 44x44 Box to Guarantee Zero Shift) */}
								<button
									onClick={() => {
										triggerHaptic('medium');
										setIsPlaying(!isPlaying);
									}}
									className="w-11 h-11 flex items-center justify-center text-white hover:text-white/90 active:scale-90 transition-transform"
									aria-label="Play/Pause"
								>
									{isPlaying ? (
										<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
											<rect x="5" y="3" width="4.5" height="18" rx="1.5" />
											<rect x="14.5" y="3" width="4.5" height="18" rx="1.5" />
										</svg>
									) : (
										<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
											<polygon points="6 3 21 12 6 21 6 3" />
										</svg>
									)}
								</button>

								{/* Next Track */}
								<button
									onClick={() => triggerHaptic('light')}
									className="w-10 h-10 flex items-center justify-center text-white/45 hover:text-white active:scale-90 transition-transform"
									aria-label="Next Track"
								>
									<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
										<polygon points="13 19 22 12 13 5 13 19" />
										<polygon points="2 19 11 12 2 5 2 19" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					{/* Row 2: Orientation + Silent Mode + Focus Capsule + Dual Vertical Sliders */}
					<div className="grid grid-cols-2 gap-3.5">
						{/* Left Column (Orientation, Mute, and Focus) */}
						<div className="flex flex-col justify-between">
							{/* Top Row: 2 Big Circular Solid-White / Red Buttons (Exact iOS Screenshot) */}
							<div className="flex items-center justify-between gap-3">
								{/* Orientation Lock (Dynamic Active White/Red vs Inactive Liquid Glass) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleOrientationLock();
									}}
									className={`w-[72px] h-[72px] rounded-full border flex items-center justify-center transition-all active:scale-90 ${
										orientationLock
											? 'bg-white text-[#ff3b30] border-white/40 shadow-[0_4px_18px_rgba(0,0,0,0.25)]'
											: 'bg-white/10 text-white border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
									}`}
									aria-label="Orientation Lock"
								>
									<svg
										width="34"
										height="34"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M21.5 12a9.5 9.5 0 1 1-2.78-6.72L21.5 8" />
										<polyline points="21.5 3 21.5 8 16.5 8" />
										<rect
											x="9.5"
											y="11.5"
											width="5"
											height="4.5"
											rx="1"
											fill="currentColor"
											stroke="none"
										/>
										<path
											d="M10.5 11.5V9.5a1.5 1.5 0 0 1 3 0v2"
											stroke="currentColor"
											strokeWidth="2"
										/>
									</svg>
								</button>

								{/* Silent Mode / Bell (Dynamic Active White/Red vs Inactive Liquid Glass) */}
								<button
									onClick={() => {
										triggerHaptic('light');
										toggleSilentMode();
									}}
									className={`w-[72px] h-[72px] rounded-full border flex items-center justify-center transition-all active:scale-90 ${
										silentMode
											? 'bg-white text-[#ff3b30] border-white/40 shadow-[0_4px_18px_rgba(0,0,0,0.25)]'
											: 'bg-white/10 text-white border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
									}`}
									aria-label="Silent Mode"
								>
									{silentMode ? (
										<svg
											width="34"
											height="34"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.6"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5M17 17H3s3-2 3-9a6 6 0 0 1 .4-2.1" />
											<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
											<line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.8" />
										</svg>
									) : (
										<svg
											width="34"
											height="34"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.6"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
											<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
										</svg>
									)}
								</button>
							</div>

							{/* Focus Capsule with 3D Flip/Spin on Click */}
							<div className="perspective-500 w-full">
								<button
									onClick={handleFocusCycle}
									style={{
										transform: `perspective(600px) rotateX(${flipDegree}deg)`,
										transition:
											'transform 0.42s cubic-bezier(0.34, 1.45, 0.64, 1), background-color 0.3s ease',
									}}
									className={`w-full h-[72px] rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-between px-4 select-none ${focusInfo.bg} ${focusInfo.border} ${focusInfo.shadow} text-white active:scale-95`}
									aria-label="Cycle Focus Mode"
								>
									<div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
										<div className="w-10 h-10 rounded-full bg-white/20 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
											<i className={`${focusInfo.icon} text-lg`}></i>
										</div>
										{/* Text container with elegant gradient fade-out / shade away mask */}
										<div
											className="flex-1 overflow-hidden whitespace-nowrap"
											style={{
												maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
												WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
											}}
										>
											<span className="text-sm font-semibold tracking-tight text-white block">
												{focusInfo.label}
											</span>
										</div>
									</div>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-white/60 flex-shrink-0 ml-1.5"
									>
										<polyline points="7 15 12 20 17 15" />
										<polyline points="7 9 12 4 17 9" />
									</svg>
								</button>
							</div>
						</div>

						{/* Right Column: Volume & Brightness Vertical Liquid Sliders */}
						<div className="grid grid-cols-2 gap-2.5">
							<VerticalSlider value={volume} onChange={setVolume} icon="speaker" label="Volume" />
							<VerticalSlider
								value={brightness}
								onChange={setBrightness}
								icon="sun"
								label="Brightness"
							/>
						</div>
					</div>

					{/* Row 3 & 4: 4-Column Grid of Liquid Glass Bubble Buttons */}
					<div className="grid grid-cols-4 gap-3 pt-1">
						{/* 1. Calculator App (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								onClose();
								if (onOpenApp) onOpenApp('calculator');
							}}
							className="w-full aspect-square rounded-full bg-white/10 text-white flex items-center justify-center shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] border border-white/20 active:scale-88 transition-transform"
							aria-label="Open Calculator"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="4" y="2" width="16" height="20" rx="4" />
								<line x1="8" y1="6" x2="16" y2="6" strokeWidth="2.6" />
								<line x1="16" y1="14" x2="16" y2="18" strokeWidth="2.6" />
								<path
									d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"
									strokeWidth="3.2"
								/>
							</svg>
						</button>

						{/* 2. Flashlight Toggle (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('medium');
								toggleFlashlight();
							}}
							className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
								flashlight
									? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
									: 'bg-white/10 text-white border-white/20'
							}`}
							aria-label="Toggle Flashlight"
						>
							<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
								<path d="M18 4H6l2 4v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l2-4zm-5 7h-2V9h2v2z" />
							</svg>
						</button>

						{/* 3. Low Power Mode / Battery (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								setLowPowerMode(!lowPowerMode);
							}}
							className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
								lowPowerMode
									? 'bg-[#ffcc00] text-black border-white/30 shadow-[0_0_20px_rgba(255,204,0,0.7)]'
									: 'bg-white/10 text-white border-white/20'
							}`}
							aria-label="Low Power Mode"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="2" y="6" width="18" height="12" rx="3.5" />
								<line x1="22" y1="10" x2="22" y2="14" strokeWidth="2.8" />
								<rect x="5" y="9" width="7" height="6" rx="1" fill="currentColor" stroke="none" />
							</svg>
						</button>

						{/* 4. Clock / Timer (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								onClose();
								if (onOpenApp) onOpenApp('clock');
							}}
							className="w-full aspect-square rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] text-white flex items-center justify-center active:scale-88 transition-transform"
							aria-label="Open Clock"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.6"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="12" cy="13" r="8" />
								<line x1="12" y1="9" x2="12" y2="13" />
								<line x1="12" y1="13" x2="15.5" y2="13" />
								<polyline points="10 2 12 2 14 2" />
							</svg>
						</button>

						{/* 5. Dark Mode (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								toggleDarkMode();
							}}
							className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
								darkMode
									? 'bg-white text-black border-white'
									: 'bg-white/10 text-white border-white/20'
							}`}
							aria-label="Toggle Dark Mode"
						>
							<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
								<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
								<path d="M12 3a9 9 0 0 0 0 18z" />
							</svg>
						</button>

						{/* 6. Notes App (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								onClose();
								if (onOpenApp) onOpenApp('notes');
							}}
							className="w-full aspect-square rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] text-white flex items-center justify-center active:scale-88 transition-transform"
							aria-label="Open Notes"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14 2 14 8 20 8" />
								<line x1="16" y1="13" x2="8" y2="13" strokeWidth="2.6" />
								<line x1="16" y1="17" x2="8" y2="17" strokeWidth="2.6" />
								<polyline points="10 9 9 9 8 9" strokeWidth="2.6" />
							</svg>
						</button>

						{/* 7. Photos App (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								onClose();
								if (onOpenApp) onOpenApp('photos');
							}}
							className="w-full aspect-square rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] text-white flex items-center justify-center active:scale-88 transition-transform"
							aria-label="Open Photos"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="3" width="18" height="18" rx="4" />
								<circle cx="8.5" cy="8.5" r="1.8" fill="currentColor" stroke="none" />
								<polyline points="21 15 16 10 5 21" strokeWidth="2.6" />
							</svg>
						</button>

						{/* 8. Camera App (Liquid Glass Bubble) */}
						<button
							onClick={() => {
								triggerHaptic('light');
								onClose();
								if (onOpenApp) onOpenApp('camera');
							}}
							className="w-full aspect-square rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] text-white flex items-center justify-center active:scale-88 transition-transform"
							aria-label="Open Camera"
						>
							<svg
								width="32"
								height="32"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
								<circle cx="12" cy="13" r="4.2" strokeWidth="2.6" />
							</svg>
						</button>
					</div>
				</div>

				{/* Home Indicator Handle */}
				<div className="w-full pb-3 flex justify-center items-center">
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

export default memo(MobileControlCenter);
