import { describe, expect, it } from 'vitest';
import {
	computeVisibleTiles,
	estimateDriveMinutes,
	formatDistance,
	haversineKm,
	latLonToWorldPx,
	parseNominatimResults,
	projectPoint,
	worldPxToLatLon,
} from './mapMath';

describe('Maps Web Mercator math & Nominatim parsing', () => {
	it('round-trips lat/lon through Web Mercator pixels', () => {
		const lat = -6.1754;
		const lon = 106.8272;
		const px = latLonToWorldPx(lat, lon, 13);
		const back = worldPxToLatLon(px.x, px.y, 13);
		expect(back.lat).toBeCloseTo(lat, 4);
		expect(back.lon).toBeCloseTo(lon, 4);
	});

	it('projects center coordinate directly to viewport midpoint', () => {
		const pt = projectPoint(37.3346, -122.0091, 37.3346, -122.0091, 14, 800, 600);
		expect(pt.x).toBeCloseTo(400, 4);
		expect(pt.y).toBeCloseTo(300, 4);
	});

	it('computes Carto Voyager (light) and Dark Matter (dark) tiles', () => {
		const light = computeVisibleTiles(-6.1754, 106.8272, 13, 800, 600, false);
		const dark = computeVisibleTiles(-6.1754, 106.8272, 13, 800, 600, true);
		expect(light.length).toBeGreaterThan(6);
		expect(light[0]?.url).toContain('rastertiles/voyager/13/');
		expect(dark[0]?.url).toContain('dark_all/13/');
	});

	it('computes realistic distance and drive estimates', () => {
		const km = haversineKm(-6.1754, 106.8272, -6.2246, 106.8095);
		expect(km).toBeGreaterThan(5);
		expect(km).toBeLessThan(7);
		expect(formatDistance(0.45)).toBe('450 m');
		expect(formatDistance(km)).toContain('km');
		expect(estimateDriveMinutes(km)).toBeGreaterThan(5);
	});

	it('parses valid Nominatim results and ignores malformed rows', () => {
		const parsed = parseNominatimResults([
			{
				place_id: 101,
				lat: '-6.175392',
				lon: '106.827153',
				name: 'Monas',
				type: 'monument',
				display_name: 'Monas, Gambir, Central Jakarta, Indonesia',
			},
			{ place_id: 102, lat: 'not-a-number', lon: '106', display_name: 'Broken' },
			null,
		]);
		expect(parsed).toHaveLength(1);
		expect(parsed[0]).toMatchObject({
			id: 'nom-101',
			name: 'Monas',
			category: 'Monument',
			subtitle: 'Gambir, Central Jakarta, Indonesia',
		});
		expect(parseNominatimResults('invalid')).toEqual([]);
	});
});
