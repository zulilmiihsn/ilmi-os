export interface MapPlace {
	id: string;
	name: string;
	subtitle: string;
	category: string;
	lat: number;
	lon: number;
}

export interface TileSpec {
	key: string;
	url: string;
	left: number;
	top: number;
}

export const TILE_SIZE = 256;
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 18;
export const DEFAULT_CENTER = { lat: -6.1754, lon: 106.8272, zoom: 13 }; // Jakarta (Monas)

export const CURATED_PLACES: MapPlace[] = [
	{
		id: 'monas',
		name: 'Monas (National Monument)',
		subtitle: 'Gambir, Central Jakarta, Indonesia',
		category: 'Landmark',
		lat: -6.175392,
		lon: 106.827153,
	},
	{
		id: 'apple-park',
		name: 'Apple Park',
		subtitle: 'One Apple Park Way, Cupertino, CA',
		category: 'Campus',
		lat: 37.334606,
		lon: -122.009102,
	},
	{
		id: 'shibuya',
		name: 'Shibuya Crossing',
		subtitle: 'Shibuya City, Tokyo, Japan',
		category: 'Landmark',
		lat: 35.659494,
		lon: 139.700553,
	},
	{
		id: 'eiffel',
		name: 'Eiffel Tower',
		subtitle: 'Champ de Mars, Paris, France',
		category: 'Landmark',
		lat: 48.85837,
		lon: 2.294481,
	},
];

export const FAVORITE_PLACES: { kind: 'home' | 'work'; place: MapPlace }[] = [
	{
		kind: 'home',
		place: {
			id: 'fav-home',
			name: 'Home',
			subtitle: 'Menteng, Central Jakarta',
			category: 'Favorite',
			lat: -6.1944,
			lon: 106.8355,
		},
	},
	{
		kind: 'work',
		place: {
			id: 'fav-work',
			name: 'Work',
			subtitle: 'SCBD, South Jakarta',
			category: 'Favorite',
			lat: -6.2246,
			lon: 106.8095,
		},
	},
];

export function clampLat(lat: number): number {
	return Math.max(-85.0511, Math.min(85.0511, lat));
}

export function wrapLon(lon: number): number {
	return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function clampZoom(zoom: number): number {
	return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(zoom)));
}

/** Projects geographic coordinates to global Web Mercator pixel coordinates at integer zoom. */
export function latLonToWorldPx(lat: number, lon: number, zoom: number): { x: number; y: number } {
	const clampedLat = clampLat(lat);
	const scale = TILE_SIZE * Math.pow(2, zoom);
	const x = ((lon + 180) / 360) * scale;
	const sinLat = Math.sin((clampedLat * Math.PI) / 180);
	const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
	return { x, y };
}

/** Inverse of latLonToWorldPx. */
export function worldPxToLatLon(x: number, y: number, zoom: number): { lat: number; lon: number } {
	const scale = TILE_SIZE * Math.pow(2, zoom);
	const lon = wrapLon((x / scale) * 360 - 180);
	const n = Math.PI - (2 * Math.PI * y) / scale;
	const lat = clampLat((180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
	return { lat, lon };
}

/** Projects a coordinate into viewport pixel coordinates centered at (centerLat, centerLon). */
export function projectPoint(
	lat: number,
	lon: number,
	centerLat: number,
	centerLon: number,
	zoom: number,
	width: number,
	height: number
): { x: number; y: number } {
	const center = latLonToWorldPx(centerLat, centerLon, zoom);
	const pt = latLonToWorldPx(lat, lon, zoom);
	return {
		x: width / 2 + (pt.x - center.x),
		y: height / 2 + (pt.y - center.y),
	};
}

/** Computes the grid of Carto raster tiles covering a viewport with a 1-tile pan buffer. */
export function computeVisibleTiles(
	centerLat: number,
	centerLon: number,
	zoom: number,
	width: number,
	height: number,
	darkMode: boolean
): TileSpec[] {
	const z = clampZoom(zoom);
	const tileCount = Math.pow(2, z);
	const center = latLonToWorldPx(centerLat, centerLon, z);
	const leftWorld = center.x - width / 2;
	const topWorld = center.y - height / 2;

	const minTx = Math.floor(leftWorld / TILE_SIZE) - 1;
	const maxTx = Math.floor((leftWorld + width) / TILE_SIZE) + 1;
	const minTy = Math.max(0, Math.floor(topWorld / TILE_SIZE) - 1);
	const maxTy = Math.min(tileCount - 1, Math.floor((topWorld + height) / TILE_SIZE) + 1);

	const style = darkMode ? 'dark_all' : 'rastertiles/voyager';
	const subdomains = ['a', 'b', 'c', 'd'];
	const tiles: TileSpec[] = [];

	for (let tx = minTx; tx <= maxTx; tx++) {
		const wrappedX = ((tx % tileCount) + tileCount) % tileCount;
		for (let ty = minTy; ty <= maxTy; ty++) {
			const sub = subdomains[Math.abs(wrappedX + ty) % subdomains.length] ?? 'a';
			tiles.push({
				key: `${z}/${wrappedX}/${ty}/${tx}`,
				url: `https://${sub}.basemaps.cartocdn.com/${style}/${z}/${wrappedX}/${ty}@2x.png`,
				left: Math.round(tx * TILE_SIZE - leftWorld),
				top: Math.round(ty * TILE_SIZE - topWorld),
			});
		}
	}
	return tiles;
}

/** Great-circle distance in kilometers. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
	if (km < 1) return `${Math.max(10, Math.round(km * 1000))} m`;
	if (km < 100) return `${km.toFixed(1)} km`;
	return `${Math.round(km).toLocaleString('en-US')} km`;
}

export function estimateDriveMinutes(km: number): number {
	return Math.max(1, Math.round((km / 38) * 60));
}

/** Validates OpenStreetMap Nominatim search results into MapPlace entries. Pure and testable. */
export function parseNominatimResults(payload: unknown): MapPlace[] {
	if (!Array.isArray(payload)) return [];
	const places: MapPlace[] = [];
	for (const entry of payload) {
		if (typeof entry !== 'object' || entry === null) continue;
		const r = entry as Record<string, unknown>;
		const lat = Number(r.lat);
		const lon = Number(r.lon);
		const displayName = typeof r.display_name === 'string' ? r.display_name.trim() : '';
		if (!Number.isFinite(lat) || !Number.isFinite(lon) || !displayName) continue;
		const parts = displayName.split(',').map(p => p.trim());
		const name = (typeof r.name === 'string' && r.name.trim()) || parts[0] || displayName;
		const subtitle = parts.slice(1, 4).join(', ') || displayName;
		const rawType = typeof r.type === 'string' ? r.type.replace(/_/g, ' ') : 'Place';
		const category = rawType.charAt(0).toUpperCase() + rawType.slice(1);
		places.push({
			id: `nom-${String(r.place_id ?? `${lat},${lon}`)}`,
			name,
			subtitle,
			category,
			lat: clampLat(lat),
			lon: wrapLon(lon),
		});
	}
	return places;
}
