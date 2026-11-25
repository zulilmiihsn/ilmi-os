'use client';

import { useState, useEffect, useMemo } from 'react';
import { getBatteryInfo, getNetworkInfo, isWifiConnected } from '../../../utils/deviceInfo';
import type { BatteryManager } from '../../../types/navigator';

export function useSystemStatus() {
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [batteryCharging, setBatteryCharging] = useState(false);
	const [isWifi, setIsWifi] = useState(true);

	const batteryColor = useMemo(() => {
		if (batteryCharging) return '#34c759';
		if (batteryLevel !== null && batteryLevel <= 20) return '#ff3b30';
		return 'currentColor';
	}, [batteryLevel, batteryCharging]);

	const batteryFillWidth = useMemo(() => {
		if (batteryLevel === null) return 100;
		return Math.max(0, Math.min(100, batteryLevel));
	}, [batteryLevel]);

	useEffect(() => {
		async function updateBattery() {
			const battery = await getBatteryInfo();
			if (battery) {
				setBatteryLevel(Math.round(battery.level * 100));
				setBatteryCharging(battery.charging);
			}
		}

		function updateNetwork() {
			const network = getNetworkInfo();
			if (network) {
				setIsWifi(isWifiConnected(network));
			}
		}

		updateBattery();
		updateNetwork();

		// Track disposal so late async results never attach listeners afterwards.
		let disposed = false;
		let batteryTarget: BatteryManager | null = null;

		if (typeof window !== 'undefined' && navigator.getBattery) {
			navigator
				.getBattery()
				.then(battery => {
					if (disposed) return;
					batteryTarget = battery;
					battery.addEventListener('chargingchange', updateBattery);
					battery.addEventListener('levelchange', updateBattery);
				})
				.catch(() => {
					// Battery API not available
				});
		}

		const connection =
			navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		if (connection) {
			connection.addEventListener('change', updateNetwork);
		}

		const networkInterval = setInterval(updateNetwork, 5000);

		return () => {
			disposed = true;
			clearInterval(networkInterval);
			if (batteryTarget) {
				batteryTarget.removeEventListener('chargingchange', updateBattery);
				batteryTarget.removeEventListener('levelchange', updateBattery);
				batteryTarget = null;
			}
			if (connection) {
				connection.removeEventListener('change', updateNetwork);
			}
		};
	}, []);

	return {
		batteryCharging,
		batteryColor,
		batteryFillWidth,
		isWifi,
	};
}
