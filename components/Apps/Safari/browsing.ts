import { generateId } from '../../../utils/id';

export interface BrowserTab {
	id: string;
	history: string[];
	hi: number; // index into history
}

export interface Bookmark {
	url: string;
	addedAt: string;
}

export interface HistoryEntry {
	url: string;
	at: string; // ISO timestamp
}

export const BOOKMARKS_KEY = 'ilmi_safari_bookmarks_v1';
export const HISTORY_KEY = 'ilmi_safari_history_v1';
const MAX_HISTORY = 50;

/** Bare words become a search; hostnames get https. Pure and testable. */
export function normalizeUrl(input: string): string | null {
	const raw = input.trim();
	if (!raw) return null;
	if (/^https?:\/\//i.test(raw)) return raw;
	if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(raw)) return `https://${raw}`;
	return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
}

/** Host for the address pill and tab cards. Never throws. */
export function displayHost(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

export function currentUrl(tab: BrowserTab): string | null {
	return tab.history[tab.hi] ?? null;
}

/** Pushes a URL, dropping forward history. Pure and testable. */
export function navigateTab(tab: BrowserTab, url: string): BrowserTab {
	return { ...tab, history: [...tab.history.slice(0, tab.hi + 1), url], hi: tab.hi + 1 };
}

export function newTab(): BrowserTab {
	return { id: generateId('tab'), history: [], hi: -1 };
}

/** Records a visit, newest first, deduped consecutively, capped. */
export function recordVisit(history: HistoryEntry[], url: string, at = new Date().toISOString()): HistoryEntry[] {
	if (history[0]?.url === url) return history;
	return [{ url, at }, ...history].slice(0, MAX_HISTORY);
}

function loadList(key: string): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed) || !parsed.every(x => typeof x === 'string')) {
			console.warn(`[Safari] stored list failed validation: ${key}`);
			return [];
		}
		return parsed;
	} catch (error) {
		console.warn(`[Safari] failed to load list: ${key}`, error);
		return [];
	}
}

function saveList(key: string, urls: string[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(key, JSON.stringify(urls));
		return true;
	} catch (error) {
		console.warn(`[Safari] failed to save list: ${key}`, error);
		return false;
	}
}

export function loadBookmarks(): string[] {
	return loadList(BOOKMARKS_KEY);
}

export function saveBookmarks(urls: string[]): boolean {
	return saveList(BOOKMARKS_KEY, urls);
}

export function toggleBookmark(urls: string[], url: string): string[] {
	return urls.includes(url) ? urls.filter(u => u !== url) : [...urls, url];
}

export function loadHistory(): HistoryEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(HISTORY_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (
			!Array.isArray(parsed) ||
			!parsed.every(
				e =>
					typeof e === 'object' &&
					e !== null &&
					typeof (e as { url?: unknown }).url === 'string' &&
					typeof (e as { at?: unknown }).at === 'string'
			)
		) {
			console.warn('[Safari] stored history failed validation, showing empty');
			return [];
		}
		return parsed as HistoryEntry[];
	} catch (error) {
		console.warn('[Safari] failed to load history, showing empty', error);
		return [];
	}
}

export function saveHistory(entries: HistoryEntry[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
		return true;
	} catch (error) {
		console.warn('[Safari] failed to save history', error);
		return false;
	}
}

/** Seed favorites shown above saved ones. */
export const DEFAULT_FAVORITES = [
	'https://www.apple.com',
	'https://developer.apple.com',
	'https://github.com',
	'https://id.wikipedia.org',
];
