import type { FileItem, FileSystemData } from './types';

const STORAGE_KEY = 'ilmi_file_system';

/**
 * Same-document notification for filesystem writes. The native `storage`
 * event only fires in *other* documents, so views open in the writing
 * document (e.g. Finder next to Terminal) would stay stale without this.
 */
export const FILE_SYSTEM_CHANGED_EVENT = 'ilmi:filesystem-changed';

function notifyFileSystemChanged(): void {
	if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
	window.dispatchEvent(new CustomEvent(FILE_SYSTEM_CHANGED_EVENT));
}

/**
 * Reload-driven views subscribe here instead of wiring `storage` directly:
 * they get cross-tab updates via `storage` plus same-document updates via
 * the local event. Safe without a DOM (returns a no-op unsubscribe).
 */
export function subscribeFileSystemChanged(listener: () => void): () => void {
	if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
		return () => {};
	}
	window.addEventListener('storage', listener);
	window.addEventListener(FILE_SYSTEM_CHANGED_EVENT, listener);
	return () => {
		window.removeEventListener('storage', listener);
		window.removeEventListener(FILE_SYSTEM_CHANGED_EVENT, listener);
	};
}

/**
 * Get default/initial file system data
 */
function getDefaultFileSystem(): FileSystemData {
	const now = new Date().toISOString();

	return {
		lastModified: now,
		items: [
			{
				id: 'folder-desktop',
				name: 'Desktop',
				type: 'folder',
				parentId: null,
				modified: now,
				created: now,
			},
			{
				id: 'folder-documents',
				name: 'Documents',
				type: 'folder',
				parentId: null,
				modified: now,
				created: now,
			},
			{
				id: 'folder-downloads',
				name: 'Downloads',
				type: 'folder',
				parentId: null,
				modified: now,
				created: now,
			},
			{
				id: 'folder-pictures',
				name: 'Pictures',
				type: 'folder',
				parentId: null,
				modified: now,
				created: now,
			},
			{
				id: 'file-welcome',
				name: 'welcome.txt',
				type: 'file',
				parentId: 'folder-documents',
				modified: now,
				created: now,
				content: 'Welcome to iLmi OS! A sleek web simulator built with Next.js.',
				size: 62,
			},
		],
	};
}

function isValidFileItem(item: unknown): item is FileItem {
	if (typeof item !== 'object' || item === null) return false;
	const record = item as Record<string, unknown>;
	if (typeof record.id !== 'string' || typeof record.name !== 'string') return false;
	if (record.type !== 'file' && record.type !== 'folder') return false;
	if (record.parentId !== null && typeof record.parentId !== 'string') return false;
	if (typeof record.modified !== 'string' || typeof record.created !== 'string') return false;
	return true;
}

export function isValidFileSystemData(data: unknown): data is FileSystemData {
	if (typeof data !== 'object' || data === null) return false;
	const record = data as Record<string, unknown>;
	// An empty items array is a valid filesystem (e.g. user deleted everything).
	if (!Array.isArray(record.items)) return false;
	return record.items.every(isValidFileItem);
}

/**
 * Load file system from localStorage.
 *
 * - Absent storage: seed and persist defaults.
 * - Valid storage (including an empty `items` array): returned as-is.
 * - Invalid/unreadable storage: defaults are returned for rendering, but the
 *   original payload is left untouched so it can be recovered or migrated.
 */
export function loadFileSystem(): FileSystemData {
	if (typeof window === 'undefined') {
		return getDefaultFileSystem();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === null) {
			const defaultData = getDefaultFileSystem();
			saveFileSystem(defaultData);
			return defaultData;
		}
		const parsed: unknown = JSON.parse(stored);
		if (isValidFileSystemData(parsed)) {
			return parsed;
		}
		console.warn('[fileSystem] stored data failed validation, using in-memory defaults');
		return getDefaultFileSystem();
	} catch (error) {
		console.warn('[fileSystem] failed to read stored data, using in-memory defaults', error);
		return getDefaultFileSystem();
	}
}

/**
 * Save file system to localStorage.
 * Returns true when the data was actually persisted.
 */
export function saveFileSystem(data: FileSystemData): boolean {
	if (typeof window === 'undefined') return false;

	try {
		data.lastModified = new Date().toISOString();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		notifyFileSystemChanged();
		return true;
	} catch (error) {
		console.warn('[fileSystem] failed to persist data', error);
		return false;
	}
}

/**
 * Reset file system to default
 */
export function resetFileSystem(): void {
	const defaultData = getDefaultFileSystem();
	saveFileSystem(defaultData);
}
