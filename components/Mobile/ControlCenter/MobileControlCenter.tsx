'use client';

import React, { useRef, forwardRef, memo, useImperativeHandle } from 'react';
import { useControlCenterStore } from '../../../stores/controlCenter';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import VerticalSlider from './VerticalSlider';
import ControlCenterConnectivity from './ControlCenterConnectivity';
import ControlCenterMedia from './ControlCenterMedia';
import ControlCenterFocusSection from './ControlCenterFocusSection';
import ControlCenterQuickGrid from './ControlCenterQuickGrid';

interface MobileControlCenterProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
}

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

		// Swipe-up dismiss tracking
		const touchStartRef = useRef<{ y: number; active: boolean } | null>(null);

		const handleTouchStart = (e: React.TouchEvent) => {
			if (!isOpen) return;
			const target = e.target as HTMLElement | null;
			if (target?.closest('.ios-vertical-slider, button, input')) return;
			const touch = e.touches[0];
			if (!touch) return;
			touchStartRef.current = { y: touch.clientY, active: true };
		};

		const handleTouchEnd = (e: React.TouchEvent) => {
			if (!touchStartRef.current?.active || !isOpen) return;
			const touch = e.changedTouches[0];
			if (!touch) return;
			const deltaY = touchStartRef.current.y - touch.clientY;
			touchStartRef.current = null;

			// Swipe up to dismiss (only if swiped UP by > 80px outside interactive controls)
			if (deltaY > 80) {
				triggerHaptic('medium');
				onClose();
			}
		};

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
					{/* Row 1: 2x2 Connectivity Bento + 2x2 Now Playing Bento */}
					<div className="grid grid-cols-2 gap-3.5">
						<ControlCenterConnectivity
							airplaneMode={airplaneMode}
							airdrop={airdrop}
							wifi={wifi}
							bluetooth={bluetooth}
							onToggleAirplaneMode={toggleAirplaneMode}
							onToggleAirdrop={toggleAirdrop}
							onToggleWifi={toggleWifi}
							onToggleBluetooth={toggleBluetooth}
						/>
						<ControlCenterMedia />
					</div>

					{/* Row 2: Orientation + Silent Mode + Focus Capsule + Dual Vertical Sliders */}
					<div className="grid grid-cols-2 gap-3.5">
						<ControlCenterFocusSection
							orientationLock={orientationLock}
							silentMode={silentMode}
							activeFocus={activeFocus}
							onToggleOrientationLock={toggleOrientationLock}
							onToggleSilentMode={toggleSilentMode}
							onSetActiveFocus={setActiveFocus}
						/>

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
					<ControlCenterQuickGrid
						flashlight={flashlight}
						darkMode={darkMode}
						onToggleFlashlight={toggleFlashlight}
						onToggleDarkMode={toggleDarkMode}
						onClose={onClose}
						onOpenApp={onOpenApp}
					/>
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
