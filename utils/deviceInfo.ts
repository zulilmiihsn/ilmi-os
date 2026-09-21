export interface BatteryInfo {
	level: number; // 0-1
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
}

export interface NetworkInfo {
	effectiveType: string; // 'slow-2g', '2g', '3g', '4g'
	downlink: number;
	rtt: number;
	saveData: boolean;
	type: string; // 'wifi', 'cellular', 'ethernet', etc.
}

export async function getBatteryInfo(): Promise<BatteryInfo | null> {
	if (typeof window !== 'undefined' && typeof navigator.getBattery === 'function') {
		try {
			const battery = await navigator.getBattery();
			return {
				level: battery.level,
				charging: battery.charging,
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
			};
		} catch (error) {
			console.warn('Battery API not available:', error);
			return null;
		}
	}
	return null;
}

export function getNetworkInfo(): NetworkInfo | null {
	if (typeof window === 'undefined') return null;

	const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

	if (connection) {
		return {
			effectiveType: connection.effectiveType || 'unknown',
			downlink: connection.downlink || 0,
			rtt: connection.rtt || 0,
			saveData: connection.saveData || false,
			type: connection.type || 'unknown',
		};
	}
	return null;
}

export function getSignalStrength(networkInfo: NetworkInfo | null): number {
	if (!networkInfo) return 3; // Default to 3 bars

	// Estimate signal strength based on effectiveType
	switch (networkInfo.effectiveType) {
		case '4g':
			return 4;
		case '3g':
			return 3;
		case '2g':
			return 2;
		case 'slow-2g':
			return 1;
		default:
			return 3;
	}
}

export function isWifiConnected(networkInfo: NetworkInfo | null): boolean {
	if (!networkInfo) return true; // Assume connected if no info
	return networkInfo.type === 'wifi' || networkInfo.type === 'ethernet';
}
