'use client';

import { computeSnapRect, type SnapZone } from '../../../utils/windowSnap';

interface SnapPreviewOverlayProps {
	zone: SnapZone | null;
	zIndex: number;
}

/**
 * Translucent macOS Sequoia-style snap guide shown beneath the dragged window
 * while the pointer hovers over a screen-edge snap zone.
 */
export default function SnapPreviewOverlay({ zone, zIndex }: SnapPreviewOverlayProps) {
	if (!zone || typeof window === 'undefined') return null;

	const rect = computeSnapRect(zone, {
		width: window.innerWidth,
		height: window.innerHeight,
	});

	return (
		<div
			className="snap-preview fixed pointer-events-none rounded-xl border border-white/50 dark:border-white/30 bg-white/25 dark:bg-white/15 backdrop-blur-md shadow-xl transition-all duration-150"
			data-snap-zone={zone}
			aria-hidden="true"
			style={{
				left: rect.x,
				top: rect.y,
				width: rect.width,
				height: rect.height,
				zIndex: Math.max(1, zIndex - 1),
			}}
		/>
	);
}
