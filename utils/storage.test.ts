import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createVersionedStorage, isBrowser } from './storage';

function installMemoryStorage() {
	const storage = new Map<string, string>();
	globalThis.localStorage = {
		getItem: (key: string) => storage.get(key) || null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
		clear: () => storage.clear(),
		key: (index: number) => Array.from(storage.keys())[index] || null,
		length: storage.size,
	} as unknown as Storage;
	(globalThis as unknown as { window: unknown }).window = globalThis;
	return storage;
}

describe('versioned storage adapter (Tahap 2)', () => {
	beforeEach(() => {
		installMemoryStorage();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('round-trips versioned payloads and rejects version mismatches', () => {
		const adapter = createVersionedStorage(1);
		adapter.save('key', [1, 2]);
		expect(adapter.load('key', [])).toEqual([1, 2]);
		expect(createVersionedStorage(2).load('key', ['default'])).toEqual(['default']);
	});

	it('falls back for absent keys and corrupt payloads', () => {
		const adapter = createVersionedStorage(1);
		expect(adapter.load('missing', ['fallback'])).toEqual(['fallback']);
		globalThis.localStorage.setItem('key', '{broken');
		expect(adapter.load('key', ['fallback'])).toEqual(['fallback']);
	});

	it('reports failed writes and clears without throwing', () => {
		const adapter = createVersionedStorage(1);
		vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota reached', 'QuotaExceededError');
		});
		expect(adapter.save('key', [1])).toBe(false);
		vi.restoreAllMocks();
		adapter.save('key', [1, 2]);
		adapter.clear('key');
		expect(adapter.load('key', ['gone'])).toEqual(['gone']);
		vi.spyOn(globalThis.localStorage, 'removeItem').mockImplementation(() => {
			throw new DOMException('Denied', 'SecurityError');
		});
		expect(() => adapter.clear('key')).not.toThrow();
	});

	it('falls back safely outside a browser', () => {
		vi.stubGlobal('window', undefined);
		expect(isBrowser()).toBe(false);
		const adapter = createVersionedStorage(1);
		expect(adapter.load('key', ['fallback'])).toEqual(['fallback']);
		expect(adapter.save('key', [1])).toBe(false);
		expect(() => adapter.clear('key')).not.toThrow();
	});

	it('treats missing storage objects as unavailable', () => {
		vi.stubGlobal('window', { localStorage: null });
		const adapter = createVersionedStorage(1);
		expect(adapter.load('key', ['fallback'])).toEqual(['fallback']);
		expect(adapter.save('key', [1])).toBe(false);
		expect(() => adapter.clear('key')).not.toThrow();
	});

	it('never throws when the localStorage getter itself is denied', () => {
		const browser = {};
		Object.defineProperty(browser, 'localStorage', {
			get() {
				throw new DOMException('Denied', 'SecurityError');
			},
		});
		vi.stubGlobal('window', browser);
		const adapter = createVersionedStorage(1);
		expect(() => adapter.load('key', [])).not.toThrow();
		expect(() => adapter.save('key', [])).not.toThrow();
		expect(() => adapter.clear('key')).not.toThrow();
		expect(adapter.load('key', ['fallback'])).toEqual(['fallback']);
	});
});
