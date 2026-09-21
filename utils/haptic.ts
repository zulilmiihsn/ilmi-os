/**
 * Haptic feedback utility for iOS-like vibration
 * Provides native-like haptic feedback when supported
 * 
 * NOTE: navigator.vibrate() must be called within a user gesture handler
 * (e.g., touchstart, touchend, click). It cannot be called from setTimeout
 * or other async callbacks without user interaction context.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// Track if user has interacted (required for vibrate API)
let hasUserInteracted = false;

/**
 * Mark that user has interacted (call this on first user interaction)
 */
export function markUserInteraction(): void {
	hasUserInteracted = true;
}

/**
 * Trigger haptic feedback if supported
 * Must be called within a user gesture handler (touchstart, touchend, click, etc.)
 * @param type - Type of haptic feedback
 * @returns true if haptic was triggered, false otherwise
 */
export function triggerHaptic(type: HapticType = 'medium'): boolean {
	// Check if Vibration API is available
	if (typeof navigator === 'undefined' || !navigator.vibrate) {
		return false;
	}

	// Check if user has interacted (required by browser security)
	if (!hasUserInteracted) {
		// Try to mark interaction now (might work if called from user event)
		hasUserInteracted = true;
	}

	// Check if device supports haptic feedback (iOS Safari, Chrome on Android)
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	const isAndroid = /Android/.test(navigator.userAgent);

	if (!isIOS && !isAndroid) {
		return false;
	}

	// Haptic feedback patterns (in milliseconds)
	const patterns: Record<HapticType, number | number[]> = {
		light: 10,
		medium: 20,
		heavy: 30,
		success: [10, 50, 10],
		warning: [20, 50, 20],
		error: [30, 50, 30, 50, 30],
	};

	const pattern = patterns[type];
	
	try {
		// Check if vibrate is available and call it
		// This will be blocked if not in user gesture context
		const result = navigator.vibrate(pattern);
		return result === true;
	} catch {
		// Silently fail if vibration is not supported or blocked
		// Don't log to avoid console spam
		return false;
	}
}

