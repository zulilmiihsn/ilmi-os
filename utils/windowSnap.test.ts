import { describe, it, expect } from 'vitest';
import { WINDOW } from '../constants';
import {
	SNAP_DOCK_RESERVE,
	SNAP_EDGE_THRESHOLD,
	SNAP_GAP,
	SNAP_MENUBAR_HEIGHT,
	SNAP_TOP_THRESHOLD,
	computeSnapRect,
	detectSnapZone,
} from './windowSnap';

const desktop = { width: 1440, height: 900 };

describe('detectSnapZone', () => {
	it('returns null for zero or negative viewport dimensions', () => {
		expect(detectSnapZone(0, 0, { width: 0, height: 900 })).toBeNull();
		expect(detectSnapZone(0, 0, { width: 1440, height: 0 })).toBeNull();
		expect(detectSnapZone(10, 10, { width: -100, height: 900 })).toBeNull();
		expect(detectSnapZone(10, 10, { width: 1440, height: -50 })).toBeNull();
	});

	it('detects left snap zone at and inside left edge threshold', () => {
		expect(detectSnapZone(0, 300, desktop)).toBe('left');
		expect(detectSnapZone(-5, 300, desktop)).toBe('left');
		expect(detectSnapZone(SNAP_EDGE_THRESHOLD, 300, desktop)).toBe('left');
	});

	it('detects right snap zone at and inside right edge threshold', () => {
		expect(detectSnapZone(desktop.width, 300, desktop)).toBe('right');
		expect(detectSnapZone(desktop.width + 10, 300, desktop)).toBe('right');
		expect(detectSnapZone(desktop.width - SNAP_EDGE_THRESHOLD, 300, desktop)).toBe('right');
	});

	it('detects top snap zone at and inside top edge threshold', () => {
		expect(detectSnapZone(720, 0, desktop)).toBe('top');
		expect(detectSnapZone(720, 12, desktop)).toBe('top');
		expect(detectSnapZone(720, SNAP_TOP_THRESHOLD, desktop)).toBe('top');
	});

	it('prioritizes left and right zones over top zone at upper corners', () => {
		expect(detectSnapZone(0, 0, desktop)).toBe('left');
		expect(detectSnapZone(SNAP_EDGE_THRESHOLD, SNAP_TOP_THRESHOLD, desktop)).toBe('left');
		expect(detectSnapZone(desktop.width, 0, desktop)).toBe('right');
		expect(detectSnapZone(desktop.width - SNAP_EDGE_THRESHOLD, SNAP_TOP_THRESHOLD, desktop)).toBe(
			'right'
		);
	});

	it('returns null in the interior outside all thresholds', () => {
		expect(detectSnapZone(720, 450, desktop)).toBeNull();
		expect(detectSnapZone(SNAP_EDGE_THRESHOLD + 1, SNAP_TOP_THRESHOLD + 1, desktop)).toBeNull();
		expect(
			detectSnapZone(desktop.width - SNAP_EDGE_THRESHOLD - 1, SNAP_TOP_THRESHOLD + 1, desktop)
		).toBeNull();
	});
});

describe('computeSnapRect', () => {
	it('produces symmetric non-overlapping left and right halves with menubar and dock clearance', () => {
		const left = computeSnapRect('left', desktop);
		const right = computeSnapRect('right', desktop);
		const expectedTop = SNAP_MENUBAR_HEIGHT + SNAP_GAP;
		const expectedHeight = desktop.height - expectedTop - SNAP_DOCK_RESERVE;

		expect(left.x).toBe(SNAP_GAP);
		expect(left.y).toBe(expectedTop);
		expect(left.height).toBe(expectedHeight);

		expect(right.y).toBe(expectedTop);
		expect(right.height).toBe(expectedHeight);

		// Symmetric widths and exact SNAP_GAP separation with no overlap.
		expect(left.width).toBe(right.width);
		expect(left.x + left.width + SNAP_GAP).toBe(right.x);
		expect(right.x + right.width + SNAP_GAP).toBe(desktop.width);

		// Clears both the top menu bar and bottom dock reserve.
		expect(left.y).toBeGreaterThanOrEqual(SNAP_MENUBAR_HEIGHT);
		expect(left.y + left.height).toBeLessThanOrEqual(desktop.height - SNAP_DOCK_RESERVE);
	});

	it('keeps odd-width viewports non-overlapping while filling usable width', () => {
		const oddViewport = { width: 1441, height: 900 };
		const left = computeSnapRect('left', oddViewport);
		const right = computeSnapRect('right', oddViewport);

		expect(left.x + left.width + SNAP_GAP).toBe(right.x);
		expect(right.x + right.width + SNAP_GAP).toBe(oddViewport.width);
		expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(1);
	});

	it('computes full usable frame for top zone', () => {
		const top = computeSnapRect('top', desktop);
		const expectedTop = SNAP_MENUBAR_HEIGHT + SNAP_GAP;

		expect(top).toEqual({
			x: SNAP_GAP,
			y: expectedTop,
			width: desktop.width - SNAP_GAP * 2,
			height: desktop.height - expectedTop - SNAP_DOCK_RESERVE,
		});
	});

	it('clamps to minimum window dimensions on narrow or short viewports', () => {
		const tiny = { width: 500, height: 320 };
		const left = computeSnapRect('left', tiny);
		const right = computeSnapRect('right', tiny);
		const top = computeSnapRect('top', tiny);

		expect(left.width).toBe(WINDOW.MIN_WIDTH);
		expect(left.height).toBe(WINDOW.MIN_HEIGHT);
		expect(right.width).toBe(WINDOW.MIN_WIDTH);
		expect(right.height).toBe(WINDOW.MIN_HEIGHT);
		expect(top.width).toBeGreaterThanOrEqual(WINDOW.MIN_WIDTH);
		expect(top.height).toBe(WINDOW.MIN_HEIGHT);
	});
});
