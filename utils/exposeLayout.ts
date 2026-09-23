/**
 * Exposé-lite tile layout (Mission Control approximation).
 * Pure and unit-testable: given N windows and the usable desktop area,
 * produce one tile rect per window in a uniform grid, scaled to fit.
 */

export interface ExposeTile {
	x: number;
	y: number;
	w: number;
	h: number;
	/** Uniform scale applied to the window's own geometry to fit the tile. */
	scale: number;
}

export interface ExposeWindowGeometry {
	id: string;
	width: number;
	height: number;
}

export interface ExposeArea {
	width: number;
	height: number;
}

const TILE_MARGIN = 24;
const MAX_TILE_SCALE = 0.6;

export function layoutExposeTiles(
	windows: ExposeWindowGeometry[],
	area: ExposeArea
): Record<string, ExposeTile> {
	if (windows.length === 0) return {};
	const cols = Math.ceil(Math.sqrt(windows.length));
	const rows = Math.ceil(windows.length / cols);
	const cellW = area.width / cols;
	const cellH = area.height / rows;
	const tiles: Record<string, ExposeTile> = {};
	windows.forEach((win, index) => {
		const col = index % cols;
		const row = Math.floor(index / cols);
		const maxW = Math.max(1, cellW - TILE_MARGIN * 2);
		const maxH = Math.max(1, cellH - TILE_MARGIN * 2);
		const scale = Math.min(MAX_TILE_SCALE, maxW / win.width, maxH / win.height);
		const w = win.width * scale;
		const h = win.height * scale;
		tiles[win.id] = {
			x: col * cellW + (cellW - w) / 2,
			y: row * cellH + (cellH - h) / 2,
			w,
			h,
			scale,
		};
	});
	return tiles;
}
