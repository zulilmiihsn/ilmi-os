/**
 * Versioned localStorage adapter.
 * - Namespaced keys to avoid collisions
 * - Schema versioning: outdated payloads fall back safely
 * - Never throws: every storage access (including the `localStorage`
 *   getter itself, which can throw under denied access) is guarded.
 * - Does NOT validate the shape of `data` and does NOT migrate between
 *   versions. Callers must validate decoded payloads and implement
 *   explicit migration when changing formats.
 */

export interface StorageAdapter {
	load<T>(key: string, fallback: T): T;
	/** Returns true when the value was actually persisted. */
	save(key: string, value: unknown): boolean;
	clear(key: string): void;
}

export function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

/** Resolve the storage object inside the guarded block: the getter itself may throw. */
function getStorage(): Storage | null {
	if (typeof window === 'undefined') return null;
	try {
		const storage = window.localStorage;
		if (!storage) return null;
		return storage;
	} catch {
		return null;
	}
}

export function createVersionedStorage(version: number): StorageAdapter {
	return {
		load<T>(key: string, fallback: T): T {
			try {
				const storage = getStorage();
				if (!storage) return fallback;
				const raw = storage.getItem(key);
				if (!raw) return fallback;
				const parsed = JSON.parse(raw) as { version?: number; data?: T };
				if (parsed.version !== version || typeof parsed.data === 'undefined') return fallback;
				return parsed.data;
			} catch (error) {
				console.warn(`[storage] corrupted payload for "${key}", using fallback`, error);
				return fallback;
			}
		},
		save(key: string, value: unknown): boolean {
			try {
				const storage = getStorage();
				if (!storage) return false;
				storage.setItem(key, JSON.stringify({ version, data: value }));
				return true;
			} catch (error) {
				console.warn(`[storage] failed to persist "${key}"`, error);
				return false;
			}
		},
		clear(key: string): void {
			try {
				const storage = getStorage();
				if (!storage) return;
				storage.removeItem(key);
			} catch (error) {
				console.warn(`[storage] failed to clear "${key}"`, error);
			}
		},
	};
}

/** Default app-wide storage (bump version when persisted schemas change). */
export const appStorage = createVersionedStorage(1);
