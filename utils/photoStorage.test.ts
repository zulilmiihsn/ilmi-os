import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	PHOTO_STORAGE_KEY,
	appendPhoto,
	computeScaledDimensions,
	deletePhoto,
	loadPhotos,
	savePhotos,
	subscribePhotosChanged,
	togglePhotoFavorite,
	type StoredPhoto,
} from './photoStorage';

function makePhoto(overrides: Partial<StoredPhoto> = {}): StoredPhoto {
	return {
		id: 'photo-1',
		url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
		date: '2026-11-25T10:00:00.000Z',
		type: 'photo',
		source: 'camera',
		isFavorite: false,
		...overrides,
	};
}

describe('photoStorage', () => {
	const listeners = new Map<string, Set<(event?: unknown) => void>>();

	beforeEach(() => {
		listeners.clear();
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

		const fakeWindow = {
			addEventListener: (type: string, cb: (event?: unknown) => void) => {
				let set = listeners.get(type);
				if (!set) {
					set = new Set();
					listeners.set(type, set);
				}
				set.add(cb);
			},
			removeEventListener: (type: string, cb: (event?: unknown) => void) => {
				listeners.get(type)?.delete(cb);
			},
			dispatchEvent: (event: { type: string }) => {
				listeners.get(event.type)?.forEach(cb => cb(event));
				return true;
			},
		};

		(globalThis as unknown as { window: unknown }).window = fakeWindow;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('distinguishes absent storage from valid empty array without seeding mocks', () => {
		expect(loadPhotos()).toEqual({ status: 'absent', photos: [] });

		expect(savePhotos([])).toEqual({ ok: true });
		expect(loadPhotos()).toEqual({ status: 'ok', photos: [], skippedCount: 0 });
	});

	it('preserves corrupted payloads untouched and refuses destructive append', () => {
		globalThis.localStorage.setItem(PHOTO_STORAGE_KEY, '{not-json');
		const loaded = loadPhotos();
		expect(loaded.status).toBe('corrupted');
		expect(loaded.photos).toEqual([]);
		expect(globalThis.localStorage.getItem(PHOTO_STORAGE_KEY)).toBe('{not-json');

		const write = appendPhoto(makePhoto());
		expect(write.ok).toBe(false);
		expect(globalThis.localStorage.getItem(PHOTO_STORAGE_KEY)).toBe('{not-json');
	});

	it('rejects non-array payloads while keeping raw storage intact', () => {
		const raw = JSON.stringify({ photos: [] });
		globalThis.localStorage.setItem(PHOTO_STORAGE_KEY, raw);
		expect(loadPhotos().status).toBe('corrupted');
		expect(globalThis.localStorage.getItem(PHOTO_STORAGE_KEY)).toBe(raw);
	});

	it('normalizes legacy camera records and skips malformed entries', () => {
		globalThis.localStorage.setItem(
			PHOTO_STORAGE_KEY,
			JSON.stringify([
				{
					id: 'legacy-1',
					url: 'data:image/png;base64,abc',
					date: '2026-01-01T00:00:00.000Z',
					type: 'photo',
				},
				{ broken: true },
				null,
			])
		);

		const loaded = loadPhotos();
		expect(loaded.status).toBe('ok');
		if (loaded.status === 'ok') {
			expect(loaded.skippedCount).toBe(2);
			expect(loaded.photos).toEqual([
				{
					id: 'legacy-1',
					url: 'data:image/png;base64,abc',
					date: '2026-01-01T00:00:00.000Z',
					type: 'photo',
					source: 'camera',
					isFavorite: false,
				},
			]);
		}
	});

	it('appends, favorites, deletes, and notifies same-document subscribers', () => {
		let notifications = 0;
		const unsubscribe = subscribePhotosChanged(() => {
			notifications += 1;
		});

		expect(appendPhoto(makePhoto({ id: 'p1' }))).toEqual({ ok: true });
		expect(appendPhoto(makePhoto({ id: 'p2', source: 'import', title: 'sunset.jpg' }))).toEqual({
			ok: true,
		});
		expect(notifications).toBe(2);

		let loaded = loadPhotos();
		expect(loaded.photos.map(p => p.id)).toEqual(['p2', 'p1']);

		expect(togglePhotoFavorite('p1')).toEqual({ ok: true });
		loaded = loadPhotos();
		expect(loaded.photos.find(p => p.id === 'p1')?.isFavorite).toBe(true);
		expect(notifications).toBe(3);

		expect(deletePhoto('p2')).toEqual({ ok: true });
		loaded = loadPhotos();
		expect(loaded.photos.map(p => p.id)).toEqual(['p1']);
		expect(notifications).toBe(4);

		unsubscribe();
		expect(deletePhoto('p1')).toEqual({ ok: true });
		expect(notifications).toBe(4);
	});

	it('reports quota errors cleanly and stays silent on failed saves', () => {
		let notifications = 0;
		const unsubscribe = subscribePhotosChanged(() => {
			notifications += 1;
		});

		vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota reached', 'QuotaExceededError');
		});

		const res = appendPhoto(makePhoto());
		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.reason).toBe('quota');
			expect(res.message).toContain('Storage full');
		}
		expect(notifications).toBe(0);
		unsubscribe();
	});

	it('scales oversized dimensions without upscaling small frames', () => {
		expect(computeScaledDimensions(2560, 1440, 1280)).toEqual({ width: 1280, height: 720 });
		expect(computeScaledDimensions(1080, 1920, 1280)).toEqual({ width: 720, height: 1280 });
		expect(computeScaledDimensions(640, 480, 1280)).toEqual({ width: 640, height: 480 });
		expect(computeScaledDimensions(0, 100, 1280)).toEqual({ width: 0, height: 0 });
	});
});
