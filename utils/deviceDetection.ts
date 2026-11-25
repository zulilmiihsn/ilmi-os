import type { DeviceInfo, Platform } from '../types';

export function detectDevice(): DeviceInfo {
	if (typeof window === 'undefined') {
		return {
			platform: 'macos',
			isMobile: false,
			isTablet: false,
			isDesktop: true,
			screenWidth: 1920,
			screenHeight: 1080,
			hasTouch: false,
		};
	}

	const width = window.innerWidth;
	const height = window.innerHeight;
	const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	const userAgent = navigator.userAgent.toLowerCase();

	let platform: Platform = 'macos';
	let isMobile = false;
	let isTablet = false;
	let isDesktop = false;

	// Detect iOS/iPadOS
	if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
		platform = 'ios';
	}

	// Determine device type based on screen size and touch capability
	if (hasTouch && width < 768) {
		isMobile = true;
		platform = 'ios';
	} else if (hasTouch && width >= 768 && width < 1024) {
		isTablet = true;
		platform = 'ios';
	} else if (!hasTouch && width >= 1024) {
		isDesktop = true;
		platform = 'macos';
	} else if (width >= 1024) {
		isDesktop = true;
		platform = 'macos';
	}

	return {
		platform,
		isMobile,
		isTablet,
		isDesktop,
		screenWidth: width,
		screenHeight: height,
		hasTouch,
	};
}
