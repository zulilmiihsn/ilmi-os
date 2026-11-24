import { WINDOW } from '../constants';

export type SnapZone = 'left' | 'right' | 'top';

export interface SnapRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface SnapViewport {
	width: number;
	height: number;
}

export const SNAP_EDGE_THRESHOLD = 24;
export const SNAP_TOP_THRESHOLD = 36;
export const SNAP_MENUBAR_HEIGHT = 28;
export const SNAP_DOCK_RESERVE = 88;
export const SNAP_GAP = 6;

/**
 * Determine which screen-edge snap zone (if any) the pointer is currently in.
 * Left and right edges take precedence over the top edge at upper corners.
 */
export function detectSnapZone(
	pointerX: number,
	pointerY: number,
	viewport: SnapViewport
): SnapZone | null {
	if (viewport.width <= 0 || viewport.height <= 0) return null;
	if (pointerX <= SNAP_EDGE_THRESHOLD) return 'left';
	if (pointerX >= viewport.width - SNAP_EDGE_THRESHOLD) return 'right';
	if (pointerY <= SNAP_TOP_THRESHOLD) return 'top';
	return null;
}

/**
 * Compute target window bounds for a given snap zone within the usable
 * desktop area (below the menu bar and above the dock).
 */
export function computeSnapRect(zone: SnapZone, viewport: SnapViewport): SnapRect {
	const top = SNAP_MENUBAR_HEIGHT + SNAP_GAP;
	const usableHeight = Math.max(WINDOW.MIN_HEIGHT, viewport.height - top - SNAP_DOCK_RESERVE);
	const halfWidth = Math.max(WINDOW.MIN_WIDTH, Math.floor((viewport.width - SNAP_GAP * 3) / 2));

	if (zone === 'left') {
		return {
			x: SNAP_GAP,
			y: top,
			width: halfWidth,
			height: usableHeight,
		};
	}

	if (zone === 'right') {
		return {
			x: SNAP_GAP * 2 + halfWidth,
			y: top,
			width: Math.max(WINDOW.MIN_WIDTH, viewport.width - SNAP_GAP * 3 - halfWidth),
			height: usableHeight,
		};
	}

	return {
		x: SNAP_GAP,
		y: top,
		width: Math.max(WINDOW.MIN_WIDTH, viewport.width - SNAP_GAP * 2),
		height: usableHeight,
	};
}
