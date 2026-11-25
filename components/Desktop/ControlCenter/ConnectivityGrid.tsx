'use client';

import { Bluetooth } from 'lucide-react';

interface ConnectivityGridProps {
	wifiEnabled: boolean;
	onToggleWifi: () => void;
	bluetoothEnabled: boolean;
	onToggleBluetooth: () => void;
	focusEnabled: boolean;
	onToggleFocus: () => void;
	airdropEnabled: boolean;
	onToggleAirdrop: () => void;
}

export default function ConnectivityGrid({
	wifiEnabled,
	onToggleWifi,
	bluetoothEnabled,
	onToggleBluetooth,
	focusEnabled,
	onToggleFocus,
	airdropEnabled,
	onToggleAirdrop,
}: ConnectivityGridProps) {
	return (
		<div className="grid grid-cols-4 gap-2 mb-2.5">
			{/* Wi-Fi */}
			<button
				type="button"
				className={`aspect-square p-3 rounded-full transition-all flex items-center justify-center hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 ${
					wifiEnabled ? 'bg-ios-blue' : 'bg-white/10'
				}`}
				onClick={onToggleWifi}
				aria-label={`Wi-Fi ${wifiEnabled ? 'On' : 'Off'}`}
			>
				<svg
					className={`w-6 h-6 ${wifiEnabled ? 'text-white' : 'text-white/50'}`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					aria-hidden="true"
				>
					<path d="M2.5 9.5a13.5 13.5 0 0 1 19 0" />
					<path d="M5.5 12.8a9 9 0 0 1 13 0" />
					<path d="M8.4 15.9a5 5 0 0 1 7.2 0" />
					<circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
				</svg>
			</button>

			{/* Bluetooth */}
			<button
				type="button"
				className={`aspect-square p-3 rounded-full transition-all flex items-center justify-center hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 ${
					bluetoothEnabled ? 'bg-ios-blue' : 'bg-white/10'
				}`}
				onClick={onToggleBluetooth}
				aria-label={`Bluetooth ${bluetoothEnabled ? 'On' : 'Off'}`}
			>
				<Bluetooth
					aria-hidden="true"
					size={18}
					className={`${bluetoothEnabled ? 'text-white' : 'text-white/50'}`}
				/>
			</button>

			{/* Focus */}
			<button
				type="button"
				className={`aspect-square p-3 rounded-full transition-all flex items-center justify-center hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 ${
					focusEnabled ? 'bg-ios-indigo' : 'bg-white/10'
				}`}
				onClick={onToggleFocus}
				aria-label={`Focus ${focusEnabled ? 'On' : 'Off'}`}
			>
				<svg
					className={`w-6 h-6 ${focusEnabled ? 'text-white' : 'text-white/50'}`}
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M20 13.2A8 8 0 1 1 10.8 4 6.6 6.6 0 0 0 20 13.2z" />
				</svg>
			</button>

			{/* AirDrop */}
			<button
				type="button"
				className={`aspect-square p-3 rounded-full transition-all flex items-center justify-center hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 ${
					airdropEnabled ? 'bg-ios-blue' : 'bg-white/10'
				}`}
				onClick={onToggleAirdrop}
				aria-label={`AirDrop ${airdropEnabled ? 'On' : 'Off'}`}
			>
				<svg
					className={`w-6 h-6 ${airdropEnabled ? 'text-white' : 'text-white/50'}`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					aria-hidden="true"
				>
					<circle cx="6" cy="12" r="2.2" />
					<circle cx="17" cy="6" r="2.2" />
					<circle cx="17" cy="18" r="2.2" />
					<path d="M8 11l7-4M8 13l7 4" />
				</svg>
			</button>
		</div>
	);
}
