'use client';

import { useState, useEffect } from 'react';
import { useControlCenterStore } from '../../stores/controlCenter';
import { getBatteryInfo } from '../../utils/deviceInfo';
import ConnectivityGrid from './ControlCenter/ConnectivityGrid';
import MediaBatterySection from './ControlCenter/MediaBatterySection';
import SmoothSlider from './ControlCenter/SmoothSlider';

const DEFAULT_TRACK = {
	title: 'Midnight Jazz Session',
	artist: 'Blue Note Quartet',
} as const;

const TRACKS = [
	DEFAULT_TRACK,
	{
		title: 'Kyoto Rain (Ambient)',
		artist: 'Hana Takahashi',
	},
	{
		title: 'Late Night Coding',
		artist: 'Lo-Fi Study Collective',
	},
] as const;

export default function ControlCenter() {
	const isOpen = useControlCenterStore(state => state.isOpen);
	const close = useControlCenterStore(state => state.close);

	// Shared connectivity, focus, display & sound state
	const wifiEnabled = useControlCenterStore(state => state.wifi);
	const toggleWifi = useControlCenterStore(state => state.toggleWifi);
	const bluetoothEnabled = useControlCenterStore(state => state.bluetooth);
	const toggleBluetooth = useControlCenterStore(state => state.toggleBluetooth);
	const airdropEnabled = useControlCenterStore(state => state.airdrop);
	const toggleAirdrop = useControlCenterStore(state => state.toggleAirdrop);
	const focusEnabled = useControlCenterStore(state => state.focusMode);
	const toggleFocusMode = useControlCenterStore(state => state.toggleFocusMode);
	const displayBrightness = useControlCenterStore(state => state.brightness);
	const setDisplayBrightness = useControlCenterStore(state => state.setBrightness);
	const soundVolume = useControlCenterStore(state => state.volume);
	const setSoundVolume = useControlCenterStore(state => state.setVolume);

	// Music player
	const [isPlaying, setIsPlaying] = useState(true);
	const [trackIndex, setTrackIndex] = useState(0);
	const currentTrack = TRACKS[trackIndex] ?? DEFAULT_TRACK;

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

	useEffect(() => {
		if (!isOpen) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, close]);

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
				className={`control-center fixed top-8 right-6 w-80 z-55 p-3.5 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-2xl shadow-2xl origin-top-right transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
					isOpen
						? 'control-center-open visible opacity-100 scale-100 translate-y-0'
						: 'control-center-closed invisible opacity-0 scale-95 -translate-y-1 pointer-events-none'
				}`}
				onClick={e => e.stopPropagation()}
				data-debug="control-center"
				role={isOpen ? 'dialog' : undefined}
				aria-label={isOpen ? 'Control Center' : undefined}
				aria-hidden={!isOpen}
			>
				<div className="control-center-content">
					{/* Top Section: Connectivity & Quick Actions - Compact Grid */}
					<ConnectivityGrid
						wifiEnabled={wifiEnabled}
						onToggleWifi={toggleWifi}
						bluetoothEnabled={bluetoothEnabled}
						onToggleBluetooth={toggleBluetooth}
						focusEnabled={focusEnabled}
						onToggleFocus={toggleFocusMode}
						airdropEnabled={airdropEnabled}
						onToggleAirdrop={toggleAirdrop}
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
						onTogglePlay={() => setIsPlaying(prev => !prev)}
						onPrevTrack={() => setTrackIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length)}
						onNextTrack={() => setTrackIndex(prev => (prev + 1) % TRACKS.length)}
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
