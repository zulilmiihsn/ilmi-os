/**
 * Type definitions for Navigator APIs (Battery, Network)
 */

export interface BatteryManager extends EventTarget {
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
	level: number;
	addEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void;
}

export interface NetworkInformation extends EventTarget {
	effectiveType: string;
	downlink: number;
	rtt: number;
	saveData: boolean;
	type: string;
	addEventListener(type: 'change', listener: () => void): void;
}

declare global {
	interface Navigator {
		getBattery?: () => Promise<BatteryManager>;
		connection?: NetworkInformation;
		mozConnection?: NetworkInformation;
		webkitConnection?: NetworkInformation;
	}
}
