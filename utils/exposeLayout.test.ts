import { describe, it, expect } from 'vitest';
import { layoutExposeTiles } from './exposeLayout';

const area = { width: 1440, height: 800 };

describe('layoutExposeTiles (Exposé)', () => {
	it('returns no tiles without windows', () => {
		expect(layoutExposeTiles([], area)).toEqual({});
	});

	it('centers a single window tile', () => {
		const tiles = layoutExposeTiles([{ id: 'a', width: 800, height: 600 }], area);
		const tile = tiles.a;
		expect(tile).toBeDefined();
		expect(tile!.scale).toBeLessThanOrEqual(0.6);
		expect(tile!.x + tile!.w / 2).toBeCloseTo(area.width / 2);
		expect(tile!.y + tile!.h / 2).toBeCloseTo(area.height / 2);
	});

	it('lays windows out in a grid without overlap', () => {
		const wins = Array.from({ length: 4 }, (_, i) => ({
			id: `w${i}`,
			width: 800,
			height: 600,
		}));
		const tiles = layoutExposeTiles(wins, area);
		expect(Object.keys(tiles)).toHaveLength(4);
		const rects = Object.values(tiles);
		for (let i = 0; i < rects.length; i++) {
			for (let j = i + 1; j < rects.length; j++) {
				const a = rects[i]!;
				const b = rects[j]!;
				const separated =
					a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
				expect(separated).toBe(true);
			}
		}
		// 2x2 grid: left column tiles sit left of right column tiles.
		expect(tiles.w0!.x).toBeLessThan(tiles.w1!.x);
		expect(tiles.w0!.y).toBeLessThan(tiles.w2!.y);
	});

	it('keeps tiles inside the usable area', () => {
		const wins = Array.from({ length: 3 }, (_, i) => ({
			id: `w${i}`,
			width: 1600,
			height: 1200,
		}));
		const tiles = Object.values(layoutExposeTiles(wins, area));
		for (const tile of tiles) {
			expect(tile.x).toBeGreaterThanOrEqual(0);
			expect(tile.y).toBeGreaterThanOrEqual(0);
			expect(tile.x + tile.w).toBeLessThanOrEqual(area.width);
			expect(tile.y + tile.h).toBeLessThanOrEqual(area.height);
		}
	});
});
