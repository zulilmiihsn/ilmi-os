import { loadFileSystem } from './storage';
import type { FileItem } from './types';

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
