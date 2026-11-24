'use client';

import { useState, useEffect } from 'react';
import { useControlCenterStore } from '../../stores/controlCenter';
import { getBatteryInfo } from '../../utils/deviceInfo';
import ConnectivityGrid from './ControlCenter/ConnectivityGrid';
import MediaBatterySection from './ControlCenter/MediaBatterySection';
import SmoothSlider from './ControlCenter/SmoothSlider';

export default function ControlCenter() {
	const isOpen = useControlCenterStore(state => state.isOpen);
	const close = useControlCenterStore(state => state.close);

	// Connectivity states
	const [wifiEnabled, setWifiEnabled] = useState(true);
	const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
	const [airdropEnabled, setAirdropEnabled] = useState(true);

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

			{/* Control Center Panel: always-dark frosted glass like macOS and the
			mobile sibling (content is white-only, so no light-mode variant). */}
			<div
				className={`control-center fixed top-8 right-6 w-80 z-55 p-3.5 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-2xl shadow-2xl transition-opacity duration-200 ${
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
					<ConnectivityGrid
						wifiEnabled={wifiEnabled}
						onToggleWifi={() => setWifiEnabled(!wifiEnabled)}
						bluetoothEnabled={bluetoothEnabled}
						onToggleBluetooth={() => setBluetoothEnabled(!bluetoothEnabled)}
						focusEnabled={focusEnabled}
						onToggleFocus={() => setFocusEnabled(!focusEnabled)}
						airdropEnabled={airdropEnabled}
						onToggleAirdrop={() => setAirdropEnabled(!airdropEnabled)}
					/>

					{/* Middle Section: Display & Sound - Stacked Bars */}
					<div className="mb-2.5">
						<div className="grid grid-cols-1 gap-2.5">
							<SmoothSlider
								value={displayBrightness}
								onChange={setDisplayBrightness}
								icon="sun"
								label="Display"
								endIcon="desktop"
							/>
							<SmoothSlider
								value={soundVolume}
								onChange={setSoundVolume}
								icon={
									soundVolume === 0 ? 'volume-mute' : soundVolume < 50 ? 'volume-down' : 'volume-up'
								}
								label="Sound"
								endIcon="broadcast-tower"
							/>
						</div>
					</div>

					{/* Bottom Section: Music Player & Battery - Compact */}
					<MediaBatterySection
						isPlaying={isPlaying}
						onTogglePlay={() => setIsPlaying(!isPlaying)}
						trackTitle={currentTrack.title}
						trackArtist={currentTrack.artist}
						batteryLevel={batteryLevel}
						batteryCharging={batteryCharging}
					/>
				</div>
			</div>
		</>
	);
}
