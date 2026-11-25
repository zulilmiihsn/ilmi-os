import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeStorageBreakdown, formatStorageSummary } from './storageMetrics';
import { PHOTO_STORAGE_KEY } from '../../../utils/photoStorage';

describe('storageMetrics', () => {
	beforeEach(() => {
		const store = new Map<string, string>();
		globalThis.localStorage = {
			getItem: (key: string) => (store.has(key) ? (store.get(key) ?? null) : null),
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => store.clear(),
			key: (index: number) => Array.from(store.keys())[index] ?? null,
			get length() {
				return store.size;
			},
		} as unknown as Storage;
		(globalThis as unknown as { window: unknown }).window = globalThis;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('aggregates real byte sizes and counts across Files, Photos, Notes, and Other', () => {
		localStorage.setItem(
			PHOTO_STORAGE_KEY,
			JSON.stringify([
				{
					id: 'p1',
					url: 'data:image/jpeg;base64,AAAA',
					date: '2026-11-25T10:00:00.000Z',
					type: 'photo',
				},
			])
		);
		localStorage.setItem('ilmi:notes:v1', JSON.stringify([{ id: 'n1', title: 'Test' }]));
		localStorage.setItem('settings-storage', JSON.stringify({ state: { darkMode: true } }));

		const breakdown = computeStorageBreakdown();
		expect(breakdown.categories.map(c => c.id)).toEqual(['files', 'photos', 'notes', 'other']);
		expect(breakdown.categories.find(c => c.id === 'photos')?.itemCount).toBe(1);
		expect(breakdown.categories.find(c => c.id === 'notes')?.itemCount).toBe(1);
		expect(breakdown.categories.find(c => c.id === 'other')?.itemCount).toBe(1);
		expect(breakdown.totalBytes).toBeGreaterThan(0);
		expect(formatStorageSummary(breakdown)).toContain('items ·');
	});
});
