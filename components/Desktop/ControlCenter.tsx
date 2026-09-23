'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useControlCenterStore } from '../../stores/controlCenter';
import { getBatteryInfo } from '../../utils/deviceInfo';

interface SmoothSliderProps {
	value: number;
	onChange: (value: number) => void;
	icon: string;
	label: string;
	endIcon?: string;
}

const SmoothSlider = ({ value, onChange, icon, label: _label, endIcon }: SmoothSliderProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const dragStartRef = useRef({ x: 0, initialValue: 0, width: 0 });

	// Update fill width visually when value changes externally (and not dragging)
	useEffect(() => {
		if (!isDragging && fillRef.current) {
			fillRef.current.style.width = `${value}%`;
		}
	}, [value, isDragging]);

	const handleStart = useCallback(
		(clientX: number) => {
			if (!containerRef.current) return;
			setIsDragging(true);

			const rect = containerRef.current.getBoundingClientRect();
			dragStartRef.current = {
				x: clientX,
				initialValue: value,
				width: rect.width,
			};

			// Initial jump to click position if clicking (not just dragging handle, but bar is the handle)
			// Actually for iOS/macOS style, clicking anywhere usually jumps or starts drag from there.
			// Let's implement absolute positioning logic.
			const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
			const percentage = (offsetX / rect.width) * 100;

			if (fillRef.current) {
				fillRef.current.style.width = `${percentage}%`;
				fillRef.current.style.transition = 'none'; // Disable transition during drag
			}
			// We can fire onChange immediately for responsiveness or wait.
			// For sliders, usually immediate feedback is expected.
			// But we want to avoid re-rendering parent often.
			// So we update DOM here, and fire onChange.
			// If parent updates state on onChange, it might re-render.
			// But since we control visual via ref, it shouldn't flicker.

			// To be truly performant, we might want to ONLY fire onChange effectively to parent defaults?
			// But parent holds state.
			// Let's assume parent state update is fine IF we don't rely on it for the visual of THIS frame.
			onChange(percentage);
		},
		[value, onChange]
	);

	const handleMove = useCallback(
		(clientX: number) => {
			if (!containerRef.current || !fillRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
			const percentage = Math.round((offsetX / rect.width) * 100);

			fillRef.current.style.width = `${percentage}%`;
			onChange(percentage);
		},
		[onChange]
	);

	useEffect(() => {
		if (!isDragging) return;

		const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
		const onTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			if (!touch) return;
			handleMove(touch.clientX);
		};

		const onEnd = () => {
			setIsDragging(false);
			if (fillRef.current) {
				fillRef.current.style.transition = 'width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
			}
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('touchmove', onTouchMove);
		window.addEventListener('mouseup', onEnd);
		window.addEventListener('touchend', onEnd);

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('mouseup', onEnd);
			window.removeEventListener('touchend', onEnd);
		};
	}, [isDragging, handleMove]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const step = 5;
			if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
				e.preventDefault();
				onChange(Math.min(100, Math.round(value + step)));
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
				e.preventDefault();
				onChange(Math.max(0, Math.round(value - step)));
			} else if (e.key === 'Home') {
				e.preventDefault();
				onChange(0);
			} else if (e.key === 'End') {
				e.preventDefault();
				onChange(100);
			}
		},
		[value, onChange]
	);

	return (
		<div
			ref={containerRef}
			role="slider"
			tabIndex={0}
			aria-label={_label || 'Level control'}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(value)}
			// Use pointer-events-auto to capture clicks
			className="relative h-11 w-full bg-black/20 dark:bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer group select-none touch-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007AFF]"
			onMouseDown={e => {
				e.preventDefault(); // Prevent text selection
				handleStart(e.clientX);
			}}
			onTouchStart={e => {
				const touch = e.touches[0];
				if (!touch) return;
				handleStart(touch.clientX);
			}}
			onKeyDown={handleKeyDown}
		>
			{/* Fill Bar */}
			<div
				ref={fillRef}
				className="absolute top-0 left-0 bottom-0 bg-white dark:bg-white transition-[width] duration-200 ease-out"
				style={{ width: `${value}%` }}
			/>

			{/* Content Overlay */}
			<div className="absolute inset-0 px-3 flex items-center justify-between pointer-events-none mix-blend-exclusion filter invert dark:invert-0">
				<div className="flex items-center justify-center w-6 h-6">
					<i className={`fas ${icon} text-lg text-black dark:text-black opacity-80`}></i>
				</div>
			</div>
			{/* Optional End Icon */}
			{endIcon && (
				<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none mix-blend-exclusion filter invert dark:invert-0">
					<i className={`fas ${endIcon} text-black dark:text-black opacity-60`}></i>
				</div>
			)}
		</div>
	);
};

export default function ControlCenter() {
	const isOpen = useControlCenterStore(state => state.isOpen);
	const close = useControlCenterStore(state => state.close);

	// Connectivity states
	const [wifiEnabled, setWifiEnabled] = useState(true);
	const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

	// Focus state
	const [focusEnabled, setFocusEnabled] = useState(false);

	// Display & Sound
	const [displayBrightness, setDisplayBrightness] = useState(75);
	const [soundVolume, setSoundVolume] = useState(25);

	// Music player
	const [isPlaying, setIsPlaying] = useState(true);
	const currentTrack = {
		title: 'Relaxing Instrumental J...',
		artist: 'Jazz Guitar Club - Relaxing In...',
	};

	// Battery info
	const [batteryLevel, setBatteryLevel] = useState<number | null>(84);
	const [batteryCharging, setBatteryCharging] = useState(false);

	useEffect(() => {
		async function updateBattery() {
			const battery = await getBatteryInfo();
			if (battery) {
				setBatteryLevel(Math.round(battery.level * 100));
				setBatteryCharging(battery.charging);
			}
		}
		updateBattery();
	}, []);

	return (
		<>
			{/* Overlay */}
			<div
				className={`control-center-overlay fixed top-7 left-0 right-0 bottom-0 z-40 bg-transparent ${
					isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
				}`}
				onClick={close}
				role="button"
				tabIndex={-1}
				aria-label="Close Control Center"
			/>

			{/* Control Center Panel */}
			<div
				className={`control-center fixed top-8 right-6 w-80 z-55 p-3.5 transition-opacity duration-200 ${
					isOpen
						? 'control-center-open visible opacity-100'
						: 'control-center-closed invisible opacity-0 pointer-events-none'
				}`}
				onClick={e => e.stopPropagation()}
				data-debug="control-center"
				aria-hidden={!isOpen}
			>
				<div className="control-center-content">
					{/* Top Section: Connectivity & Quick Actions - Compact Grid */}
					<div className="grid grid-cols-4 gap-2 mb-2.5">
						{/* Wi-Fi */}
						<button
							className={`control-connectivity-button aspect-square p-3 rounded-xl transition-all flex items-center justify-center ${
								wifiEnabled ? 'control-button-active' : ''
							}`}
							onClick={() => setWifiEnabled(!wifiEnabled)}
							aria-label={`Wi-Fi ${wifiEnabled ? 'On' : 'Off'}`}
						>
							<i
								className={`fas fa-wifi text-xl ${wifiEnabled ? 'text-white' : 'text-white/50'}`}
							></i>
						</button>

						{/* Bluetooth */}
						<button
							className={`control-connectivity-button aspect-square p-3 rounded-xl transition-all flex items-center justify-center ${
								bluetoothEnabled ? 'control-button-active' : ''
							}`}
							onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
							aria-label={`Bluetooth ${bluetoothEnabled ? 'On' : 'Off'}`}
						>
							<i
								className={`fab fa-bluetooth-b text-xl ${bluetoothEnabled ? 'text-white' : 'text-white/50'}`}
							></i>
						</button>

						{/* Focus */}
						<button
							className={`control-connectivity-button aspect-square p-3 rounded-xl transition-all flex items-center justify-center ${
								focusEnabled ? 'control-button-active' : ''
							}`}
							onClick={() => setFocusEnabled(!focusEnabled)}
							aria-label={`Focus ${focusEnabled ? 'On' : 'Off'}`}
						>
							<i
								className={`fas fa-moon text-xl ${focusEnabled ? 'text-white' : 'text-white/50'}`}
							></i>
						</button>

						{/* Profile */}
						<button
							className="control-connectivity-button aspect-square p-3 rounded-xl transition-all flex items-center justify-center"
							aria-label="User Profile"
						>
							<i className="fas fa-user text-xl text-white"></i>
						</button>
					</div>

					{/* Middle Section: Display & Sound - Stacked Bars */}
					<div className="mb-2.5">
						<div className="grid grid-cols-1 gap-2.5">
							<SmoothSlider
								value={displayBrightness}
								onChange={setDisplayBrightness}
								icon="fa-sun"
								label="Display"
								endIcon="fa-desktop"
							/>
							<SmoothSlider
								value={soundVolume}
								onChange={setSoundVolume}
								icon={
									soundVolume === 0
										? 'fa-volume-mute'
										: soundVolume < 50
											? 'fa-volume-down'
											: 'fa-volume-up'
								}
								label="Sound"
								endIcon="fa-broadcast-tower"
							/>
						</div>
					</div>

					{/* Bottom Section: Music Player & Battery - Compact */}
					<div className="space-y-2">
						{/* Music Player Widget - Compact */}
						<div className="control-music-widget p-2.5 rounded-xl">
							<div className="flex items-center gap-2 mb-2">
								{/* Album Art - Smaller */}
								<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-400 to-purple-500 shrink-0 overflow-hidden relative">
									<Image
										src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=64&h=64&fit=crop"
										alt="Album art"
										width={40}
										height={40}
										className="object-cover rounded-lg"
										unoptimized
									/>
								</div>
								{/* Track Info - Compact */}
								<div className="flex-1 min-w-0">
									<div className="text-xs font-semibold text-white truncate">
										{currentTrack.title}
									</div>
									<div className="text-[10px] text-white/70 truncate">{currentTrack.artist}</div>
								</div>
							</div>
							{/* Playback Controls - Compact */}
							<div className="flex items-center justify-center gap-2">
								<button
									className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
									aria-label="Previous track"
								>
									<i className="fas fa-backward text-[10px] text-white"></i>
								</button>
								<button
									className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
									onClick={() => setIsPlaying(!isPlaying)}
									aria-label={isPlaying ? 'Pause' : 'Play'}
								>
									<i
										className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-[10px] text-white`}
									></i>
								</button>
								<button
									className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
									aria-label="Next track"
								>
									<i className="fas fa-forward text-[10px] text-white"></i>
								</button>
							</div>
						</div>

						{/* Battery Indicator - Compact */}
						<div className="control-battery p-2.5 rounded-xl">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-white">Battery</span>
								<div className="flex items-center gap-2">
									{batteryCharging ? (
										<i className="fas fa-bolt text-sm text-white"></i>
									) : (
										<div className="relative flex items-center">
											<div className="w-8 h-4 border border-white/70 rounded-[2px] relative overflow-hidden">
												<div
													className="absolute left-0.5 top-0.5 bottom-0.5 rounded-[1px] bg-white transition-all"
													style={{ width: `${batteryLevel || 0}%` }}
												></div>
											</div>
											<div className="ml-0.5 w-0.5 h-2 bg-white/70 rounded-r-[1px]"></div>
										</div>
									)}
									<span className="text-xs font-medium text-white">{batteryLevel}%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
