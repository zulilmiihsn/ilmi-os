'use client';

import React from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface ControlCenterConnectivityProps {
	airplaneMode: boolean;
	airdrop: boolean;
	wifi: boolean;
	bluetooth: boolean;
	onToggleAirplaneMode: () => void;
	onToggleAirdrop: () => void;
	onToggleWifi: () => void;
	onToggleBluetooth: () => void;
}

const activeBtnClass =
	'bg-ios-blue text-white border-white/30 shadow-[0_0_18px_rgba(0,122,255,0.7)]';
const inactiveBtnClass = 'bg-white/10 text-white border-white/20';
const baseBtnClass =
	'w-full aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.2)]';

export default function ControlCenterConnectivity({
	airplaneMode,
	airdrop,
	wifi,
	bluetooth,
	onToggleAirplaneMode,
	onToggleAirdrop,
	onToggleWifi,
	onToggleBluetooth,
}: ControlCenterConnectivityProps) {
	return (
		<div className="bg-white/10 p-3.5 rounded-[38px] border border-white/20 flex items-center justify-center aspect-square shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_0_rgba(0,0,0,0.25)]">
			{/* 4 Big Circular Buttons inside Connectivity */}
			<div className="grid grid-cols-2 gap-2.5 w-full">
				{/* 1. Airplane Mode (Top-Left: Bold Horizontal Plane) */}
				<button
					onClick={() => {
						triggerHaptic('light');
						onToggleAirplaneMode();
					}}
					className={`${baseBtnClass} ${airplaneMode ? activeBtnClass : inactiveBtnClass}`}
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
						onToggleAirdrop();
					}}
					className={`${baseBtnClass} ${airdrop && !airplaneMode ? activeBtnClass : inactiveBtnClass}`}
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
						onToggleWifi();
					}}
					className={`${baseBtnClass} ${wifi && !airplaneMode ? activeBtnClass : inactiveBtnClass}`}
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
						onToggleBluetooth();
					}}
					className={`${baseBtnClass} ${bluetooth ? activeBtnClass : inactiveBtnClass}`}
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
	);
}
