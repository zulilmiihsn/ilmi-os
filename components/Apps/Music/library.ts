export interface DemoTrack {
	id: string;
	title: string;
	artist: string;
	/** Length of the generated loop, seconds. */
	durationSec: number;
	/** Melody seed for the WebAudio generator. */
	seed: number;
	/** Artwork gradient stops. */
	hue: [string, string];
}

export const DEMO_TRACKS: DemoTrack[] = [
	{ id: 'glasswing', title: 'Glasswing', artist: 'Pagi Drive', durationSec: 24, seed: 11, hue: ['#5e5ce6', '#0a84ff'] },
	{ id: 'kopi tubruk', title: 'Kopi Tubruk', artist: 'Samarinda Tapes', durationSec: 28, seed: 27, hue: ['#ff9f0a', '#ff375f'] },
	{ id: 'amparan', title: 'Amparan', artist: 'Mahakam Drift', durationSec: 21, seed: 42, hue: ['#30d158', '#64d2ff'] },
	{ id: 'senja-darat', title: 'Senja Darat', artist: 'Pagi Drive', durationSec: 32, seed: 63, hue: ['#ff375f', '#bf5af2'] },
	{ id: 'hujan-batu', title: 'Hujan Batu', artist: 'Mahakam Drift', durationSec: 26, seed: 88, hue: ['#64d2ff', '#5e5ce6'] },
];

export const LIKED_KEY = 'ilmi_music_liked_v1';

export function isValidLiked(data: unknown): data is string[] {
	return Array.isArray(data) && data.every(x => typeof x === 'string');
}

/** Invalid payloads render as unliked without touching storage. */
export function loadLiked(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(LIKED_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!isValidLiked(parsed)) {
			console.warn('[Music] stored likes failed validation, showing none');
			return [];
		}
		return parsed;
	} catch (error) {
		console.warn('[Music] failed to load likes, showing none', error);
		return [];
	}
}

/** Returns true when the likes were actually persisted. */
export function saveLiked(ids: string[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
		return true;
	} catch (error) {
		console.warn('[Music] failed to save likes', error);
		return false;
	}
}

export function toggleLiked(ids: string[], id: string): string[] {
	return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}

export type RepeatMode = 'off' | 'all' | 'one';

/** Deterministic PRNG so shuffle is unit-testable. */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Track order for a fresh play. Shuffled with a random seed live. */
export function buildQueue(tracks: DemoTrack[], startId: string, shuffle: boolean, rand = Math.random): string[] {
	const ids = tracks.map(t => t.id);
	const rest = ids.filter(id => id !== startId);
	if (shuffle) {
		for (let i = rest.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			const a = rest[i];
			const b = rest[j];
			if (a === undefined || b === undefined) continue;
			rest[i] = b;
			rest[j] = a;
		}
	}
	return [startId, ...rest];
}

/** Next index with wrap; null stops at the end unless repeat-all. Pure and testable. */
export function nextIndex(queue: string[], current: number, repeat: RepeatMode): number | null {
	if (queue.length === 0) return null;
	if (repeat === 'one') return current;
	const next = current + 1;
	if (next < queue.length) return next;
	return repeat === 'all' ? 0 : null;
}

/** Previous index; restarts the song when past 3s (like iOS). Pure and testable. */
export function prevIndex(
	queue: string[],
	current: number,
	positionSec: number,
	repeat: RepeatMode
): number | 'restart' {
	if (positionSec > 3 || current <= 0) return 'restart';
	if (repeat === 'one') return current;
	return current - 1;
}

/** m:ss, never NaN. */
export function formatPlayerTime(totalSec: number): string {
	const s = Number.isFinite(totalSec) ? Math.max(0, Math.floor(totalSec)) : 0;
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
