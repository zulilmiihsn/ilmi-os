import type { FileItem as SharedFileItem } from '../../../utils/fileSystem';
import { isValidFileSystemData, loadFileSystem, saveFileSystem } from '../../../utils/fileSystem';

// The Files app previously persisted its own flat `{ items }` list under this
// key, without parent folders. Items are migrated once into the shared
// hierarchical model (as root-level records) instead of maintaining a fork.
const LEGACY_STORAGE_KEY = 'fileSystem';
// Must stay in sync with the shared store in utils/fileSystem.ts.
const SHARED_STORAGE_KEY = 'ilmi_file_system';

interface LegacyFileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	size?: unknown;
	modified: string;
}

function isValidLegacyItem(item: unknown): item is LegacyFileItem {
	if (typeof item !== 'object' || item === null) return false;
	const record = item as Record<string, unknown>;
	return (
		typeof record.id === 'string' &&
		typeof record.name === 'string' &&
		(record.type === 'file' || record.type === 'folder') &&
		typeof record.modified === 'string'
	);
}

/** Best-effort conversion of legacy display sizes ("2.4 MB") to bytes. */
export function parseDisplaySize(value: unknown): number | undefined {
	if (typeof value !== 'string') return undefined;
	const match = value.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
	if (!match) return undefined;
	const amount = Number(match[1]);
	if (!Number.isFinite(amount)) return undefined;
	const unit = (match[2] || 'B').toUpperCase();
	const factor = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1;
	return Math.round(amount * factor);
}

function toSharedItem(legacy: LegacyFileItem): SharedFileItem {
	return {
		id: legacy.id,
		name: legacy.name,
		type: legacy.type,
		parentId: null,
		size: parseDisplaySize(legacy.size),
		modified: legacy.modified,
		created: legacy.modified,
	};
}

function readRaw(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

export type FilesMigrationResult =
	| 'nothing-to-migrate'
	| 'migrated'
	| 'legacy-invalid'
	| 'shared-invalid'
	| 'persist-failed';

/**
 * Move legacy flat Files records into the shared filesystem exactly once.
 * The legacy key is removed only after the merged destination persists.
 * Corrupt payloads on either side are left untouched for manual recovery.
 */
export function migrateLegacyFilesStorage(): FilesMigrationResult {
	const legacyRaw = readRaw(LEGACY_STORAGE_KEY);
	if (legacyRaw === null) return 'nothing-to-migrate';

	let legacyItems: unknown;
	try {
		const parsed: unknown = JSON.parse(legacyRaw);
		legacyItems =
			typeof parsed === 'object' &&
			parsed !== null &&
			Array.isArray((parsed as { items?: unknown }).items)
				? (parsed as { items: unknown }).items
				: null;
	} catch {
		return 'legacy-invalid';
	}
	if (!Array.isArray(legacyItems) || !legacyItems.every(isValidLegacyItem)) {
		return 'legacy-invalid';
	}

	const sharedRaw = readRaw(SHARED_STORAGE_KEY);
	if (sharedRaw !== null) {
		try {
			if (!isValidFileSystemData(JSON.parse(sharedRaw))) {
				return 'shared-invalid';
			}
		} catch {
			return 'shared-invalid';
		}
	}

	const fs = loadFileSystem();
	const existingIds = new Set(fs.items.map(item => item.id));
	for (const legacy of legacyItems) {
		if (!existingIds.has(legacy.id)) {
			fs.items.push(toSharedItem(legacy));
			existingIds.add(legacy.id);
		}
	}
	if (!saveFileSystem(fs)) {
		return 'persist-failed';
	}
	try {
		window.localStorage.removeItem(LEGACY_STORAGE_KEY);
	} catch {
		// Destination already holds the merged data; a stale legacy key is harmless.
	}
	return 'migrated';
}
