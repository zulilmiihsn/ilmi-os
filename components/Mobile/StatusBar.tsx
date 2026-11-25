'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Plane, Wifi } from 'lucide-react';
import { getBatteryInfo, getNetworkInfo, getSignalStrength } from '../../utils/deviceInfo';
import { useControlCenterStore } from '../../stores/controlCenter';
import '../../types/navigator';
import MobileClock from './MobileClock';

interface StatusBarProps {
	backgroundColor?: string;
	textColor?: string;
	onOpenNotificationCenter?: () => void;
	onOpenControlCenter?: () => void;
}

function StatusBar({
	backgroundColor,
	textColor,
	onOpenNotificationCenter,
	onOpenControlCenter,
}: StatusBarProps) {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [batteryCharging, setBatteryCharging] = useState(false);
	const [signalBars, setSignalBars] = useState(3);

	const wifi = useControlCenterStore(state => state.wifi);
	const airplaneMode = useControlCenterStore(state => state.airplaneMode);
	const lowPowerMode = useControlCenterStore(state => state.lowPowerMode);

	const signalBarArray = useMemo(() => [0, 1, 2, 3], []);

	// Authentic iOS battery color priority: charging green > low-power yellow > low red > monochrome
	const batteryColor = useMemo(() => {
		if (batteryCharging) return '#34c759';
		if (lowPowerMode) return '#ffcc00';
		if (batteryLevel !== null && batteryLevel <= 20) return '#ff3b30';
		return 'currentColor';
	}, [batteryCharging, lowPowerMode, batteryLevel]);

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
			}
		}

		// Initial load
		updateBattery();
		updateNetwork();

		// Listen for battery changes using event-based updates (no polling)
		let disposed = false;
		let batteryRef: { removeEventListener: (type: string, listener: () => void) => void } | null =
			null;
		if (typeof window !== 'undefined' && navigator.getBattery) {
			navigator
				.getBattery()
				.then(battery => {
					if (disposed) return;
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
			disposed = true;
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
			className="ios-statusbar fixed top-0 left-0 right-0 z-60 text-sm font-semibold select-none"
			style={{
				background: statusBgColor,
				backgroundColor: statusBgColor,
				color: statusTextColor,
				backdropFilter: 'none',
				paddingTop: 'env(safe-area-inset-top)',
			}}
		>
			<div className="relative h-[44px] flex items-center justify-between px-6">
				{/* Left Side: Clock */}
				<button
					type="button"
					className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ios-blue rounded"
					style={{ color: statusTextColor }}
					onClick={onOpenNotificationCenter}
					aria-label="Open Notification Center"
					aria-haspopup="dialog"
				>
					<span aria-hidden="true">
						<MobileClock textColor={statusTextColor} />
					</span>
				</button>

				{/* Center: Dynamic Island */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[25px] rounded-full bg-[#09090b] shadow-inner"
				/>

				{/* Right Side: Connectivity & Battery */}
				<button
					type="button"
					className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ios-blue rounded"
					style={{ color: statusTextColor }}
					onClick={onOpenControlCenter}
					aria-label="Open Control Center"
					aria-haspopup="dialog"
				>
					{airplaneMode ? (
						<Plane aria-hidden="true" size={13} className="shrink-0" />
					) : (
						<>
							{/* Cellular Signal Bars */}
							<div aria-hidden="true" className="flex items-end gap-0.5">
								{signalBarArray.map(i => (
									<div
										key={i}
										className={`w-[2.5px] rounded-sm ${i < signalBars ? 'opacity-100' : 'opacity-30'}`}
										style={{
											height: `${3.5 + i * 2}px`,
											backgroundColor: 'currentColor',
										}}
									/>
								))}
							</div>

							{/* Wi-Fi Icon */}
							{wifi && <Wifi aria-hidden="true" size={13} className="shrink-0" />}
						</>
					)}

					{/* Battery */}
					<div aria-hidden="true" className="flex items-center">
						<div className="relative flex items-center">
							{/* Battery Body */}
							<div className="w-[24.5px] h-[11.5px] border border-current/35 rounded-[3.5px] p-[1.5px] relative">
								{/* Battery Fill */}
								<div
									className="h-full rounded-[1.5px] transition-all duration-300"
									style={{
										width: `${batteryFillWidth}%`,
										backgroundColor: batteryColor,
									}}
								/>
								{/* Charging Bolt Overlay */}
								{batteryCharging && (
									<svg
										aria-hidden="true"
										viewBox="0 0 12 16"
										className="w-2.5 h-2.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.65)]"
										fill="currentColor"
									>
										<path d="M7.2 0.5L1.8 8.8h3.6L4.6 15.5l5.6-8.3H6.6L7.2 0.5z" />
									</svg>
								)}
							</div>
							{/* Battery Terminal (Cap) */}
							<div className="w-[1.5px] h-[4px] rounded-r-[1px] translate-x-[0.5px] bg-current opacity-35" />
						</div>
					</div>
				</button>
			</div>
		</div>
	);
}

export default memo(StatusBar);
