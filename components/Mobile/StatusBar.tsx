'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import {
	getBatteryInfo,
	getNetworkInfo,
	getSignalStrength,
	isWifiConnected,
} from '../../utils/deviceInfo';
import '../../types/navigator';
import MobileClock from './MobileClock';

interface StatusBarProps {
	backgroundColor?: string;
	textColor?: string;
}

function StatusBar({ backgroundColor, textColor }: StatusBarProps) {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [batteryCharging, setBatteryCharging] = useState(false);
	const [signalBars, setSignalBars] = useState(3);
	const [isWifi, setIsWifi] = useState(true);

	const signalBarArray = useMemo(() => [0, 1, 2, 3], []);

	// Computed battery color based on level
	const batteryColor = useMemo(() => {
		if (batteryLevel === null) return '#34c759'; // Green default
		if (batteryLevel <= 20) return '#ff3b30'; // Red
		if (batteryLevel <= 50) return '#ff9500'; // Orange
		return '#34c759'; // Green
	}, [batteryLevel]);

	// Computed battery fill width
	const batteryFillWidth = useMemo(() => {
		if (batteryLevel === null) return 100;
		return Math.max(0, Math.min(100, batteryLevel));
	}, [batteryLevel]);

	useEffect(() => {
		// Get battery info
		async function updateBattery() {
			const battery = await getBatteryInfo();
			if (battery) {
				setBatteryLevel(Math.round(battery.level * 100));
				setBatteryCharging(battery.charging);
			}
		}

		// Get network info
		function updateNetwork() {
			const network = getNetworkInfo();
			if (network) {
				setSignalBars(getSignalStrength(network));
				setIsWifi(isWifiConnected(network));
			}
		}

		// Initial load
		updateBattery();
		updateNetwork();

		// Listen for battery changes using event-based updates (no polling)
		let batteryRef: { removeEventListener: (type: string, listener: () => void) => void } | null =
			null;
		if (typeof window !== 'undefined' && navigator.getBattery) {
			navigator
				.getBattery()
				.then(battery => {
					batteryRef = battery;
					battery.addEventListener('chargingchange', updateBattery);
					battery.addEventListener('levelchange', updateBattery);
				})
				.catch(() => {
					// Battery API not available
				});
		}

		// Listen for network changes using event-based updates (no polling needed if events work)
		const connection =
			navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		if (connection) {
			connection.addEventListener('change', updateNetwork);
		}

		// Only poll network if connection API doesn't support events (reduced from 5s to 30s)
		const networkInterval = !connection ? setInterval(updateNetwork, 30000) : null;

		return () => {
			if (networkInterval) clearInterval(networkInterval);
			if (batteryRef) {
				batteryRef.removeEventListener('chargingchange', updateBattery);
				batteryRef.removeEventListener('levelchange', updateBattery);
			}
			if (connection) {
				connection.removeEventListener('change', updateNetwork);
			}
		};
	}, []);

	const statusTextColor = textColor || 'white';
	const statusBgColor = backgroundColor || 'transparent';

	return (
		<div
			className="ios-statusbar fixed top-0 left-0 right-0 z-60 flex items-center justify-between px-8 py-2 text-sm font-semibold"
			style={{
				background: statusBgColor,
				backgroundColor: statusBgColor,
				color: statusTextColor,
				backdropFilter: 'none',
			}}
		>
			<div className="flex items-center gap-1" style={{ color: statusTextColor }}>
				<MobileClock textColor={statusTextColor} />
			</div>
			<div className="flex items-center gap-1.5" style={{ color: statusTextColor }}>
				{/* Signal Strength */}
				{!isWifi && (
					<div className="flex items-end gap-0.5">
						{signalBarArray.map(i => (
							<div
								key={i}
								className={`w-0.5 rounded-sm ${i < signalBars ? 'opacity-100' : 'opacity-30'}`}
								style={{
									height: `${3 + i * 2}px`,
									backgroundColor: statusTextColor,
								}}
							></div>
						))}
					</div>
				)}

				{/* WiFi Icon */}
				{isWifi && <i className="fas fa-wifi text-xs" style={{ color: statusTextColor }}></i>}

				{/* Battery */}
				<div className="flex items-center">
					<div className="relative flex items-center">
						{/* Battery Body */}
						<div
							className="w-[24.5px] h-[11.5px] border border-opacity-35 rounded-[3.5px] p-[1.5px] relative"
							style={{ borderColor: statusTextColor }}
						>
							{/* Battery Fill */}
							<div
								className={`h-full rounded-[1.5px] transition-all duration-300 ${
									batteryCharging ? 'bg-green-500' : ''
								}`}
								style={{
									width: `${batteryFillWidth}%`,
									backgroundColor: batteryCharging ? '#34c759' : batteryColor,
								}}
							></div>
						</div>
						{/* Battery Terminal (Cap) */}
						<div
							className="w-[1.5px] h-[4px] rounded-r-[1px] translate-x-[-0.5px] opacity-35"
							style={{ backgroundColor: statusTextColor }}
						></div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default memo(StatusBar);
