/**
 * File System Utilities using localStorage
 * Manages file and folder structure in browser storage
 */

import { generateId } from './id';

export interface FileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	parentId: string | null; // null for root items
	size?: number; // in bytes
	modified: string; // ISO date string
	created: string; // ISO date string
	icon?: string;
	content?: string; // for text files
}

export interface FileSystemData {
	items: FileItem[];
	lastModified: string;
}

const STORAGE_KEY = 'ilmi_file_system';

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
		return true;
	} catch (error) {
		console.warn('[fileSystem] failed to persist data', error);
		return false;
	}
}

/**
 * Get items in a specific folder
 */
export function getItemsInFolder(parentId: string | null): FileItem[] {
	const fs = loadFileSystem();
	return fs.items.filter(item => item.parentId === parentId);
}

/**
 * Get item by ID
 */
export function getItemById(id: string): FileItem | undefined {
	const fs = loadFileSystem();
	return fs.items.find(item => item.id === id);
}

/**
 * Create a new folder. Returns null when the change could not be persisted.
 */
export function createFolder(name: string, parentId: string | null): FileItem | null {
	const fs = loadFileSystem();
	const now = new Date().toISOString();

	const newFolder: FileItem = {
		id: generateId('folder'),
		name,
		type: 'folder',
		parentId,
		modified: now,
		created: now,
	};

	fs.items.push(newFolder);
	if (!saveFileSystem(fs)) {
		return null;
	}

	return newFolder;
}

/**
 * Create a new file
 */
export function createFile(
	name: string,
	parentId: string | null,
	content: string = '',
	size?: number
): FileItem | null {
	const fs = loadFileSystem();
	const now = new Date().toISOString();

	const newFile: FileItem = {
		id: generateId('file'),
		name,
		type: 'file',
		parentId,
		size: size || new Blob([content]).size,
		modified: now,
		created: now,
		content,
	};

	fs.items.push(newFile);
	if (!saveFileSystem(fs)) {
		return null;
	}

	return newFile;
}

/**
 * Delete an item (and all its children if it's a folder)
 */
export function deleteItem(id: string): boolean {
	const fs = loadFileSystem();
	const item = fs.items.find(i => i.id === id);

	if (!item) return false;

	const idsToDelete = new Set<string>([id]);
	if (item.type === 'folder') {
		const collectChildren = (parentId: string) => {
			fs.items
				.filter(i => i.parentId === parentId)
				.forEach(child => {
					idsToDelete.add(child.id);
					if (child.type === 'folder') {
						collectChildren(child.id);
					}
				});
		};
		collectChildren(id);
	}

	fs.items = fs.items.filter(i => !idsToDelete.has(i.id));
	return saveFileSystem(fs);
}

/**
 * Rename an item
 */
export function renameItem(id: string, newName: string): boolean {
	const fs = loadFileSystem();
	const item = fs.items.find(i => i.id === id);

	if (!item) return false;

	item.name = newName;
	item.modified = new Date().toISOString();
	return saveFileSystem(fs);
}

/**
 * Move an item to a different folder
 */
export function moveItem(id: string, newParentId: string | null): boolean {
	const fs = loadFileSystem();
	const item = fs.items.find(i => i.id === id);

	if (!item) return false;

	// Prevent moving a folder into itself or its children
	if (item.type === 'folder') {
		let currentParent = newParentId;
		while (currentParent) {
			if (currentParent === id) return false;
			const parent = fs.items.find(i => i.id === currentParent);
			currentParent = parent?.parentId || null;
		}
	}

	item.parentId = newParentId;
	item.modified = new Date().toISOString();
	return saveFileSystem(fs);
}

/**
 * Get item count in a folder (direct children only)
 */
export function getItemCount(folderId: string): number {
	const fs = loadFileSystem();
	return fs.items.filter(item => item.parentId === folderId).length;
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date to readable format
 */
export function formatDate(isoDate: string): string {
	const date = new Date(isoDate);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${day}/${month}/${year}`;
}

/**
 * Search items by name
 */
export function searchItems(query: string): FileItem[] {
	const fs = loadFileSystem();
	const lowerQuery = query.toLowerCase();

	return fs.items.filter(item => item.name.toLowerCase().includes(lowerQuery));
}

/**
 * Reset file system to default
 */
export function resetFileSystem(): void {
	const defaultData = getDefaultFileSystem();
	saveFileSystem(defaultData);
}

/**
 * Update file text content
 */
export function updateFileContent(id: string, content: string): boolean {
	const fs = loadFileSystem();
	const item = fs.items.find(i => i.id === id);
	if (!item || item.type !== 'file') return false;

	item.content = content;
	item.size = new Blob([content]).size;
	item.modified = new Date().toISOString();
	return saveFileSystem(fs);
}

/**
 * Get breadcrumbs from root down to the specified folder
 */
export function getBreadcrumbs(folderId: string | null): FileItem[] {
	if (!folderId) return [];
	const fs = loadFileSystem();
	const crumbs: FileItem[] = [];
	let currentId: string | null = folderId;

	while (currentId) {
		const item = fs.items.find(i => i.id === currentId);
		if (!item) break;
		crumbs.unshift(item);
		currentId = item.parentId;
	}

	return crumbs;
}

/**
 * Get folder ID by slash-separated path (e.g. "Documents" or "Documents/Projects").
 * Returns null for root, or undefined when the path cannot be resolved.
 */
export function resolveFolderPath(pathStr: string): string | null | undefined {
	const normalized = pathStr.trim().replace(/^\/+|\/+$/g, '');
	if (!normalized || normalized === '~' || normalized === '.') return null;

	const parts = normalized.split('/');
	const fs = loadFileSystem();
	let currentParentId: string | null = null;

	for (const part of parts) {
		if (part === '..') {
			if (currentParentId) {
				const parentItem = fs.items.find(i => i.id === currentParentId);
				currentParentId = parentItem?.parentId || null;
			}
			continue;
		}
		if (part === '.' || part === '~') continue;

		const match = fs.items.find(
			i =>
				i.type === 'folder' &&
				i.parentId === currentParentId &&
				i.name.toLowerCase() === part.toLowerCase()
		);
		if (!match) return undefined; // Not found
		currentParentId = match.id;
	}

	return currentParentId;
}
