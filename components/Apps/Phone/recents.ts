import { generateId } from '../../../utils/id';

export interface CallLogEntry {
	id: string;
	number: string;
	startedAt: string; // ISO timestamp
	durationSec: number;
}

export const RECENTS_KEY = 'ilmi_phone_recents_v1';
export const FAVORITES_KEY = 'ilmi_phone_favorites_v1';
const MAX_ENTRIES = 50;
const MAX_FAVORITES = 30;

export interface FavoriteEntry {
	number: string;
	addedAt: string; // ISO timestamp
}

export function isValidFavorites(data: unknown): data is FavoriteEntry[] {
	return (
		Array.isArray(data) &&
		data.every(
			e =>
				typeof e === 'object' &&
				e !== null &&
				typeof (e as { number?: unknown }).number === 'string' &&
				typeof (e as { addedAt?: unknown }).addedAt === 'string'
		)
	);
}

/** Invalid payloads render as empty without touching storage. */
export function loadFavorites(): FavoriteEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(FAVORITES_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!isValidFavorites(parsed)) {
			console.warn('[Phone] stored favorites failed validation, showing empty list');
			return [];
		}
		return parsed;
	} catch (error) {
		console.warn('[Phone] failed to load favorites, showing empty list', error);
		return [];
	}
}

/** Returns true when the favorites were actually persisted. */
export function saveFavorites(entries: FavoriteEntry[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(entries));
		return true;
	} catch (error) {
		console.warn('[Phone] failed to save favorites', error);
		return false;
	}
}

/** Adds a number unless already favorited. Pure and testable. */
export function addFavorite(
	entries: FavoriteEntry[],
	number: string,
	addedAt = new Date().toISOString()
): FavoriteEntry[] {
	const target = number.trim();
	if (!target || entries.some(e => e.number === target)) return entries;
	return [{ number: target, addedAt }, ...entries].slice(0, MAX_FAVORITES);
}

/** Removes a number. Pure and testable. */
export function removeFavorite(entries: FavoriteEntry[], number: string): FavoriteEntry[] {
	return entries.filter(e => e.number !== number);
}

export function isValidCallLog(data: unknown): data is CallLogEntry[] {
	return (
		Array.isArray(data) &&
		data.every(
			e =>
				typeof e === 'object' &&
				e !== null &&
				typeof (e as { id?: unknown }).id === 'string' &&
				typeof (e as { number?: unknown }).number === 'string' &&
				typeof (e as { startedAt?: unknown }).startedAt === 'string' &&
				typeof (e as { durationSec?: unknown }).durationSec === 'number'
		)
	);
}

/** Invalid payloads render as empty without touching storage. */
export function loadRecents(): CallLogEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(RECENTS_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!isValidCallLog(parsed)) {
			console.warn('[Phone] stored recents failed validation, showing empty log');
			return [];
		}
		return parsed;
	} catch (error) {
		console.warn('[Phone] failed to load recents, showing empty log', error);
		return [];
	}
}

/** Returns true when the log was actually persisted. */
export function saveRecents(entries: CallLogEntry[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(RECENTS_KEY, JSON.stringify(entries));
		return true;
	} catch (error) {
		console.warn('[Phone] failed to save recents', error);
		return false;
	}
}

/** Prepends a call, newest first, capped. Pure and testable. */
export function addCallLog(
	entries: CallLogEntry[],
	call: { number: string; startedAt: string; durationSec: number }
): CallLogEntry[] {
	return [{ ...call, id: generateId('call') }, ...entries].slice(0, MAX_ENTRIES);
}

/** "9:41 AM" today, "Yesterday", else M/D/YY. Never NaN. */
export function formatCallTime(iso: string, now = new Date()): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const dayKey = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
	if (dayKey(d) === dayKey(now)) {
		return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
	return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

/** 65 -> "1:05". */
export function formatCallDuration(totalSec: number): string {
	const s = Math.max(0, Math.floor(totalSec));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
