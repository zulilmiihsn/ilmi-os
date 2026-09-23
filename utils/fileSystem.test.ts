import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	formatFileSize,
	formatDate,
	getBreadcrumbs,
	loadFileSystem,
	createFolder,
	createFile,
	renameItem,
	deleteItem,
	getItemById,
	getItemsInFolder,
	resolveFolderPath,
	saveFileSystem,
	subscribeFileSystemChanged,
	updateFileContent,
	type FileItem,
} from './fileSystem';

/** Unwrap nullable creates in tests: persistence is expected to succeed here. */
function mustCreateFolder(name: string, parentId: string | null): FileItem {
	const folder = createFolder(name, parentId);
	expect(folder).not.toBeNull();
	return folder as FileItem;
}

function mustCreateFile(name: string, parentId: string | null, content: string): FileItem {
	const file = createFile(name, parentId, content);
	expect(file).not.toBeNull();
	return file as FileItem;
}

describe('fileSystem utilities', () => {
	beforeEach(() => {
		// Mock localStorage for node environment
		const storage = new Map<string, string>();
		globalThis.localStorage = {
			getItem: (key: string) => storage.get(key) || null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
			clear: () => storage.clear(),
			key: (index: number) => Array.from(storage.keys())[index] || null,
			length: storage.size,
		} as unknown as Storage;

		// Mock window
		(globalThis as unknown as { window: unknown }).window = globalThis;
	});

	describe('formatFileSize', () => {
		it('formats zero bytes correctly', () => {
			expect(formatFileSize(0)).toBe('0 Bytes');
		});

		it('formats bytes correctly', () => {
			expect(formatFileSize(500)).toBe('500 Bytes');
		});

		it('formats kilobytes correctly', () => {
			expect(formatFileSize(1024)).toBe('1 KB');
			expect(formatFileSize(2048)).toBe('2 KB');
		});

		it('formats megabytes correctly', () => {
			expect(formatFileSize(1024 * 1024)).toBe('1 MB');
		});

		it('formats gigabytes correctly', () => {
			expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
		});
	});

	describe('formatDate', () => {
		it('formats date to short readable string', () => {
			const formatted = formatDate('2026-01-15T10:30:00.000Z');
			expect(formatted).toBeTruthy();
			expect(typeof formatted).toBe('string');
		});
	});

	describe('file and folder CRUD operations', () => {
		it('initializes default file system if empty', () => {
			const fs = loadFileSystem();
			expect(fs.items.length).toBeGreaterThan(0);
			expect(fs.items.some(item => item.name === 'Desktop')).toBe(true);
		});

		it('creates a new folder and finds it', () => {
			const folder = mustCreateFolder('Projects', null);
			expect(folder.name).toBe('Projects');
			expect(folder.type).toBe('folder');
			expect(folder.parentId).toBeNull();

			const found = getItemById(folder.id);
			expect(found).toBeDefined();
			expect(found?.name).toBe('Projects');
		});

		it('creates a new file within a folder', () => {
			const folder = mustCreateFolder('Work', null);
			const file = mustCreateFile('report.txt', folder.id, 'Quarterly report content');

			expect(file.name).toBe('report.txt');
			expect(file.parentId).toBe(folder.id);
			expect(file.content).toBe('Quarterly report content');

			const itemsInFolder = getItemsInFolder(folder.id);
			expect(itemsInFolder.some(item => item.id === file.id)).toBe(true);
		});

		it('renames an existing item', () => {
			const folder = mustCreateFolder('OldName', null);
			const renamed = renameItem(folder.id, 'NewName');

			expect(renamed).toBe(true);
			const updated = getItemById(folder.id);
			expect(updated?.name).toBe('NewName');
		});

		it('deletes an item and its children recursively', () => {
			const parentFolder = mustCreateFolder('ParentFolder', null);
			const childFile = mustCreateFile('child.txt', parentFolder.id, 'hello');

			expect(getItemById(parentFolder.id)).toBeDefined();
			expect(getItemById(childFile.id)).toBeDefined();

			const deleted = deleteItem(parentFolder.id);
			expect(deleted).toBe(true);

			expect(getItemById(parentFolder.id)).toBeUndefined();
			expect(getItemById(childFile.id)).toBeUndefined();
		});

		it('generates breadcrumbs accurately', () => {
			const rootBreadcrumbs = getBreadcrumbs(null);
			expect(rootBreadcrumbs).toEqual([]);

			const parent = mustCreateFolder('Documents', null);
			const subfolder = mustCreateFolder('Receipts', parent.id);

			const crumbs = getBreadcrumbs(subfolder.id);
			expect(crumbs.length).toBe(2);
			expect(crumbs[0]?.name).toBe('Documents');
			expect(crumbs[1]?.name).toBe('Receipts');
		});
	});

	describe('integrity regressions (Tahap 2)', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('keeps an emptied filesystem empty instead of reseeding defaults', () => {
			for (const item of loadFileSystem().items.filter(i => i.parentId === null)) {
				expect(deleteItem(item.id)).toBe(true);
			}
			expect(loadFileSystem().items).toEqual([]);
			// A subsequent read (e.g. after reload) must not resurrect defaults.
			expect(loadFileSystem().items).toEqual([]);
		});

		it('reports failure and keeps old content when writes are rejected', () => {
			const file = loadFileSystem().items.find(i => i.type === 'file');
			expect(file).toBeDefined();
			const originalContent = file!.content;
			vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
				throw new DOMException('Quota reached', 'QuotaExceededError');
			});
			expect(updateFileContent(file!.id, 'unsaved content')).toBe(false);
			expect(createFolder('Lost', null)).toBeNull();
			expect(renameItem(file!.id, 'lost.txt')).toBe(false);
			expect(deleteItem(file!.id)).toBe(false);
			// saveFileSystem itself reports the outcome instead of swallowing it.
			expect(saveFileSystem(loadFileSystem())).toBe(false);
			expect(getItemById(file!.id)?.content).toBe(originalContent);
		});

		it('preserves malformed payloads instead of overwriting them with defaults', () => {
			globalThis.localStorage.setItem('ilmi_file_system', '{broken');
			expect(loadFileSystem().items.length).toBeGreaterThan(0);
			expect(globalThis.localStorage.getItem('ilmi_file_system')).toBe('{broken');
		});

		it('rejects wrong-shaped payloads without overwriting them', () => {
			globalThis.localStorage.setItem(
				'ilmi_file_system',
				JSON.stringify({ items: [{ id: 1, name: null }] })
			);
			expect(loadFileSystem().items.length).toBeGreaterThan(0);
			expect(globalThis.localStorage.getItem('ilmi_file_system')).toContain('"id":1');
		});

		it('distinguishes root from unresolvable paths', () => {
			expect(resolveFolderPath('/')).toBeNull();
			expect(resolveFolderPath('no-such-folder')).toBeUndefined();
		});
	});

	describe('live sync notification (Tahap 3)', () => {
		// Node has no window event system, so drive subscribe/notify through
		// a minimal fake window instead of asserting against a no-op.
		const listeners = new Map<string, Set<() => void>>();
		const fakeWindow = {
			addEventListener: (type: string, listener: () => void) => {
				if (!listeners.has(type)) listeners.set(type, new Set());
				listeners.get(type)!.add(listener);
			},
			removeEventListener: (type: string, listener: () => void) => {
				listeners.get(type)?.delete(listener);
			},
			dispatchEvent: (event: { type: string }) => {
				listeners.get(event.type)?.forEach(listener => listener());
				return true;
			},
		};
		beforeEach(() => {
			listeners.clear();
			(globalThis as unknown as Record<string, unknown>).window = fakeWindow;
		});

		it('notifies subscribers after a successful save in the same document', () => {
			loadFileSystem(); // seed defaults before subscribing
			let calls = 0;
			const stop = subscribeFileSystemChanged(() => {
				calls += 1;
			});
			expect(saveFileSystem(loadFileSystem())).toBe(true);
			expect(calls).toBe(1);
			stop();
		});

		it('stops notifying after unsubscribe', () => {
			let calls = 0;
			const stop = subscribeFileSystemChanged(() => {
				calls += 1;
			});
			stop();
			expect(saveFileSystem(loadFileSystem())).toBe(true);
			expect(calls).toBe(0);
		});

		it('stays silent on failed saves', () => {
			let calls = 0;
			const stop = subscribeFileSystemChanged(() => {
				calls += 1;
			});
			vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
				throw new DOMException('Quota reached', 'QuotaExceededError');
			});
			expect(saveFileSystem(loadFileSystem())).toBe(false);
			expect(calls).toBe(0);
			stop();
		});

		it('is safe without a window (SSR)', () => {
			const holder = globalThis as unknown as Record<string, unknown>;
			const prevWindow = holder.window;
			delete holder.window;
			try {
				const stop = subscribeFileSystemChanged(() => {});
				expect(() => stop()).not.toThrow();
				expect(saveFileSystem({ items: [], lastModified: 'x' })).toBe(false);
			} finally {
				holder.window = prevWindow;
			}
		});
	});
});
