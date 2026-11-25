import { describe, it, expect } from 'vitest';
import {
	DEMO_TRACKS,
	buildQueue,
	createCatalogCache,
	formatPlayerTime,
	isValidLiked,
	nextIndex,
	parseItunesResults,
	prevIndex,
	toggleLiked,
} from './library';

describe('music queue', () => {
	it('starts playback on the picked track in order', () => {
		expect(buildQueue(DEMO_TRACKS, 'amparan', false)).toEqual([
			'amparan',
			'glasswing',
			'kopi tubruk',
			'senja-darat',
			'hujan-batu',
		]);
	});

	it('shuffles deterministically with a seeded rand', () => {
		const a = buildQueue(DEMO_TRACKS, 'glasswing', true, () => 0.1);
		const b = buildQueue(DEMO_TRACKS, 'glasswing', true, () => 0.1);
		expect(a).toEqual(b);
		expect(a[0]).toBe('glasswing');
		expect([...a].sort()).toEqual([...DEMO_TRACKS.map(t => t.id)].sort());
	});

	it('advances, wraps, and stops per repeat mode', () => {
		const q = ['a', 'b', 'c'];
		expect(nextIndex(q, 0, 'off')).toBe(1);
		expect(nextIndex(q, 2, 'off')).toBeNull();
		expect(nextIndex(q, 2, 'all')).toBe(0);
		expect(nextIndex(q, 1, 'one')).toBe(1);
		expect(nextIndex([], 0, 'all')).toBeNull();
	});

	it('restarts past 3s like iOS, else steps back', () => {
		expect(prevIndex(['a', 'b'], 1, 10, 'off')).toBe('restart');
		expect(prevIndex(['a', 'b'], 1, 2, 'off')).toBe(0);
		expect(prevIndex(['a', 'b'], 0, 0, 'off')).toBe('restart');
		expect(prevIndex(['a', 'b'], 1, 0, 'one')).toBe(1);
	});

	it('toggles and validates likes', () => {
		expect(toggleLiked([], 'x')).toEqual(['x']);
		expect(toggleLiked(['x'], 'x')).toEqual([]);
		expect(isValidLiked(['x'])).toBe(true);
		expect(isValidLiked([1])).toBe(false);
	});

	it('formats player times', () => {
		expect(formatPlayerTime(65)).toBe('1:05');
		expect(formatPlayerTime(NaN)).toBe('0:00');
	});

	it('parses iTunes search payloads and upgrades artwork to 600px', () => {
		const tracks = parseItunesResults({
			results: [
				{
					trackId: 99,
					trackName: 'Hati-Hati di Jalan',
					artistName: 'Tulus',
					collectionName: 'Manusia',
					previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
					artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/100x100bb.jpg',
					trackTimeMillis: 242000,
				},
				{ trackId: 100, trackName: 'No Preview', artistName: 'X', previewUrl: 'http://insecure' },
			],
		});
		expect(tracks).toHaveLength(1);
		expect(tracks[0]).toMatchObject({
			id: 'itunes-99',
			title: 'Hati-Hati di Jalan',
			artist: 'Tulus',
			album: 'Manusia',
			durationSec: 30,
			source: 'itunes',
			artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/600x600bb.jpg',
		});
		expect(parseItunesResults(null)).toEqual([]);
	});

	it('caches catalog search queries with normalization, TTL expiry, and LRU eviction', () => {
		const cache = createCatalogCache(2, 1000);
		const trackA = DEMO_TRACKS.slice(0, 1);
		const trackB = DEMO_TRACKS.slice(1, 2);
		const trackC = DEMO_TRACKS.slice(2, 3);

		cache.set('  Tulus  ', trackA, 100);
		expect(cache.get('tulus', 500)).toEqual(trackA);
		expect(cache.get('tulus', 1100)).toBeNull();

		cache.set('alpha', trackA, 2000);
		cache.set('beta', trackB, 2000);
		// Touch alpha so beta becomes least-recently-used.
		expect(cache.get('alpha', 2100)).toEqual(trackA);
		cache.set('gamma', trackC, 2200);
		expect(cache.get('beta', 2300)).toBeNull();
		expect(cache.get('alpha', 2300)).toEqual(trackA);
		expect(cache.get('gamma', 2300)).toEqual(trackC);
	});
});
