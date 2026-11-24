import { generateId } from '../id';
import { loadFileSystem, saveFileSystem } from './storage';
import type { FileItem } from './types';

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
 * Search items by name
 */
export function searchItems(query: string): FileItem[] {
	const fs = loadFileSystem();
	const lowerQuery = query.toLowerCase();

	return fs.items.filter(item => item.name.toLowerCase().includes(lowerQuery));
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
