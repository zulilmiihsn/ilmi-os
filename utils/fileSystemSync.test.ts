import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	getBreadcrumbs,
	loadFileSystem,
	createFolder,
	createFile,
	renameItem,
	deleteItem,
	getItemById,
	moveItem,
	resetFileSystem,
	resolveFolderPath,
	saveFileSystem,
	searchItems,
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

describe('fileSystem validation and live sync', () => {
	beforeEach(() => {
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
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('validation and edge operations (Tahap 6)', () => {
		it.each([
			['non-object item', { items: [null] }],
			['wrong type', { items: [{ id: 'a', name: 'b', type: 'x', parentId: null, modified: 'd', created: 'd' }] }],
			['non-string parent', { items: [{ id: 'a', name: 'b', type: 'file', parentId: 5, modified: 'd', created: 'd' }] }],
			['non-string dates', { items: [{ id: 'a', name: 'b', type: 'file', parentId: null, modified: 1, created: 2 }] }],
			['non-object root', 'just-a-string'],
			['non-array items', { items: {} }],
		])('rejects %s while preserving the stored payload', (_label, payload) => {
			const raw = JSON.stringify(payload);
			globalThis.localStorage.setItem('ilmi_file_system', raw);
			expect(loadFileSystem().items.length).toBeGreaterThan(0);
			expect(globalThis.localStorage.getItem('ilmi_file_system')).toBe(raw);
		});

		it('returns defaults without touching storage outside a browser', () => {
			const holder = globalThis as unknown as Record<string, unknown>;
			const prevWindow = holder.window;
			delete holder.window;
			try {
				expect(loadFileSystem().items.length).toBeGreaterThan(0);
				expect(saveFileSystem(loadFileSystem())).toBe(false);
			} finally {
				holder.window = prevWindow;
			}
		});

		it('reports missing targets instead of pretending success', () => {
			expect(deleteItem('missing')).toBe(false);
			expect(renameItem('missing', 'x')).toBe(false);
			expect(updateFileContent('missing', 'x')).toBe(false);
			const folder = mustCreateFolder('F', null);
			expect(updateFileContent(folder.id, 'x')).toBe(false);
			expect(getBreadcrumbs('missing')).toEqual([]);
		});

		it('returns null when a create cannot persist', () => {
			vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
				throw new DOMException('Quota reached', 'QuotaExceededError');
			});
			expect(createFile('lost.txt', null, 'x')).toBeNull();
		});

		it('deletes nested folders recursively', () => {
			const parent = mustCreateFolder('P', null);
			const child = mustCreateFolder('C', parent.id);
			const file = mustCreateFile('f.txt', child.id, 'x');
			expect(deleteItem(parent.id)).toBe(true);
			expect(getItemById(parent.id)).toBeUndefined();
			expect(getItemById(child.id)).toBeUndefined();
			expect(getItemById(file.id)).toBeUndefined();
		});

		it('moves items but refuses cycles and missing targets', () => {
			const parent = mustCreateFolder('P', null);
			const child = mustCreateFolder('C', parent.id);
			expect(moveItem('missing', null)).toBe(false);
			expect(moveItem(parent.id, parent.id)).toBe(false);
			expect(moveItem(parent.id, child.id)).toBe(false);
			expect(moveItem(child.id, null)).toBe(true);
			expect(getItemById(child.id)?.parentId).toBeNull();
		});

		it('resolves dot segments against the shared hierarchy', () => {
			expect(resolveFolderPath('Documents/..')).toBeNull();
			expect(resolveFolderPath('Documents/../Downloads')).toBe('folder-downloads');
			expect(resolveFolderPath('Documents/.')).toBe('folder-documents');
			expect(resolveFolderPath('..')).toBeNull();
		});

		it('searches by name and resets to heal corrupt states', () => {
			const folder = mustCreateFolder('Projects', null);
			mustCreateFile('project-plan.txt', folder.id, 'x');
			expect(searchItems('proj').map(i => i.id).sort()).toEqual(
				[folder.id, loadFileSystem().items.find(i => i.name === 'project-plan.txt')?.id].sort()
			);
			expect(searchItems('PROJECT')).toHaveLength(2);
			expect(searchItems('no-such-thing')).toEqual([]);
			globalThis.localStorage.setItem('ilmi_file_system', '{broken');
			resetFileSystem();
			expect(loadFileSystem().items.length).toBeGreaterThan(0);
			expect(searchItems('Desktop')).toHaveLength(1);
			expect(searchItems('Projects')).toEqual([]);
		});

		it('reports a move that cannot persist and tolerates broken chains', () => {
			const parent = mustCreateFolder('P', null);
			const child = mustCreateFolder('C', parent.id);
			vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
				throw new DOMException('Quota reached', 'QuotaExceededError');
			});
			expect(moveItem(child.id, null)).toBe(false);
			vi.restoreAllMocks();
			// A parent id with no record ends the cycle walk; the move proceeds.
			expect(moveItem(child.id, 'ghost')).toBe(true);
			expect(getItemById(child.id)?.parentId).toBe('ghost');
			expect(moveItem(parent.id, 'ghost')).toBe(true);
		});
	});

	describe('live sync notification (Tahap 3)', () => {
		// Node has no window event system, so drive subscribe/notify through
		// a minimal fake window instead of asserting against a no-op.
		const listeners = new Map<string, Set<() => void>>();
		const fakeWindow = {
			addEventListener: (type: string, listener: () => void) => {
				let set = listeners.get(type);
				if (!set) {
					set = new Set();
					listeners.set(type, set);
				}
				set.add(listener);
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
