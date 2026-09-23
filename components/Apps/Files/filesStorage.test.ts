import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { migrateLegacyFilesStorage, parseDisplaySize } from './utils';
import { getItemCount, getItemsInFolder, loadFileSystem } from '../../../utils/fileSystem';

const LEGACY_KEY = 'fileSystem';
const SHARED_KEY = 'ilmi_file_system';

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
}

const legacyPayload = {
	items: [
		{ id: '1', name: 'Downloads', type: 'folder', modified: '2026-01-01T00:00:00.000Z' },
		{
			id: '4',
			name: 'Project Proposal.pdf',
			type: 'file',
			size: '2.4 MB',
			modified: '2026-01-02T00:00:00.000Z',
		},
	],
};

describe('Files migration (Tahap 3)', () => {
	beforeEach(() => {
		installMemoryStorage();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('does nothing when no legacy data exists', () => {
		expect(migrateLegacyFilesStorage()).toBe('nothing-to-migrate');
		expect(globalThis.localStorage.getItem(SHARED_KEY)).toBeNull();
	});

	it('migrates legacy items as root records and removes the legacy key', () => {
		globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPayload));
		expect(migrateLegacyFilesStorage()).toBe('migrated');
		expect(globalThis.localStorage.getItem(LEGACY_KEY)).toBeNull();

		const folder = getItemsInFolder(null).find(item => item.id === '1');
		expect(folder).toMatchObject({ name: 'Downloads', parentId: null });
		const file = getItemsInFolder(null).find(item => item.id === '4');
		expect(file?.size).toBe(Math.round(2.4 * 1024 * 1024));
		// Shared hierarchy now works: children of a migrated folder are listed.
		expect(getItemCount('1')).toBe(0);
	});

	it('merges into an existing shared store without duplicating ids', () => {
		loadFileSystem();
		globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPayload));
		expect(migrateLegacyFilesStorage()).toBe('migrated');
		const ids = loadFileSystem().items.map(item => item.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain('1');
	});

	it('leaves corrupt legacy payloads untouched', () => {
		globalThis.localStorage.setItem(LEGACY_KEY, '{broken');
		expect(migrateLegacyFilesStorage()).toBe('legacy-invalid');
		expect(globalThis.localStorage.getItem(LEGACY_KEY)).toBe('{broken');
	});

	it('leaves both stores untouched when the shared payload is invalid', () => {
		globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPayload));
		globalThis.localStorage.setItem(SHARED_KEY, JSON.stringify({ items: [{ id: 1 }] }));
		expect(migrateLegacyFilesStorage()).toBe('shared-invalid');
		expect(globalThis.localStorage.getItem(LEGACY_KEY)).toContain('Downloads');
		expect(globalThis.localStorage.getItem(SHARED_KEY)).toContain('"id":1');
	});

	it('keeps the legacy key when the merged write fails', () => {
		globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPayload));
		const rawSet = globalThis.localStorage.setItem.bind(globalThis.localStorage);
		vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(
			(key: string, value: string) => {
				if (key === SHARED_KEY) throw new DOMException('Quota reached', 'QuotaExceededError');
				rawSet(key, value);
			}
		);
		expect(migrateLegacyFilesStorage()).toBe('persist-failed');
		expect(globalThis.localStorage.getItem(LEGACY_KEY)).toContain('Downloads');
	});

	it('parses legacy display sizes conservatively', () => {
		expect(parseDisplaySize('2.4 MB')).toBe(Math.round(2.4 * 1024 * 1024));
		expect(parseDisplaySize('1.1 MB')).toBe(Math.round(1.1 * 1024 * 1024));
		expect(parseDisplaySize('512 B')).toBe(512);
		expect(parseDisplaySize('nonsense')).toBeUndefined();
		expect(parseDisplaySize('1.2.3 MB')).toBeUndefined();
		expect(parseDisplaySize(undefined)).toBeUndefined();
	});

	it('rejects legacy items that fail validation without touching stores', () => {
		const raw = JSON.stringify({ items: [null, { id: '1' }] });
		globalThis.localStorage.setItem(LEGACY_KEY, raw);
		expect(migrateLegacyFilesStorage()).toBe('legacy-invalid');
		expect(globalThis.localStorage.getItem(LEGACY_KEY)).toBe(raw);
		expect(globalThis.localStorage.getItem(SHARED_KEY)).toBeNull();
	});

	it('treats an unreadable shared store as invalid and storage failure as absent', () => {
		globalThis.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPayload));
		globalThis.localStorage.setItem(SHARED_KEY, '{broken');
		expect(migrateLegacyFilesStorage()).toBe('shared-invalid');
		const holder = globalThis as unknown as Record<string, unknown>;
		const prevWindow = holder.window;
		delete holder.window;
		try {
			expect(migrateLegacyFilesStorage()).toBe('nothing-to-migrate');
		} finally {
			holder.window = prevWindow;
		}
	});
});
