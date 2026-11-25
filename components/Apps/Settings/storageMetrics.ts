import { loadFileSystem, formatFileSize } from '../../../utils/fileSystem';
import { loadPhotos, PHOTO_STORAGE_KEY } from '../../../utils/photoStorage';

export interface StorageCategory {
	id: 'files' | 'photos' | 'notes' | 'other';
	label: string;
	bytes: number;
	itemCount: number;
	colorClass: string;
	appId?: 'finder' | 'photos' | 'notes';
}

export interface StorageBreakdown {
	totalBytes: number;
	budgetBytes: number;
	totalItems: number;
	categories: StorageCategory[];
}

export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;
const FILES_KEY = 'ilmi_file_system';
const NOTES_KEY = 'ilmi:notes:v1';

function utf16Bytes(value: string | null): number {
	return value ? value.length * 2 : 0;
}

/**
 * Measure real browser localStorage usage grouped by OS subsystem
 * (Files, Photos, Notes, Other). Pure read-only inspection.
 */
export function computeStorageBreakdown(): StorageBreakdown {
	if (typeof window === 'undefined') {
		return { totalBytes: 0, budgetBytes: STORAGE_BUDGET_BYTES, totalItems: 0, categories: [] };
	}

	let filesCount = 0;
	let filesBytes = 0;
	try {
		const fsItems = loadFileSystem().items ?? [];
		filesCount = fsItems.length;
		filesBytes = Math.max(
			fsItems.reduce((sum, item) => sum + (item.size ?? 0), 0),
			utf16Bytes(localStorage.getItem(FILES_KEY))
		);
	} catch {
		filesCount = 0;
		filesBytes = 0;
	}

	let photosCount = 0;
	let photosBytes = 0;
	try {
		photosCount = loadPhotos().photos.length;
		photosBytes = utf16Bytes(localStorage.getItem(PHOTO_STORAGE_KEY));
	} catch {
		photosCount = 0;
		photosBytes = 0;
	}

	let notesCount = 0;
	let notesBytes = 0;
	try {
		const rawNotes = localStorage.getItem(NOTES_KEY);
		notesBytes = utf16Bytes(rawNotes);
		if (rawNotes) {
			const parsed: unknown = JSON.parse(rawNotes);
			if (Array.isArray(parsed)) notesCount = parsed.length;
		}
	} catch {
		notesCount = 0;
		notesBytes = 0;
	}

	let otherBytes = 0;
	let otherKeys = 0;
	try {
		const known = new Set([FILES_KEY, PHOTO_STORAGE_KEY, NOTES_KEY]);
		for (let i = 0; i < localStorage.length; i += 1) {
			const key = localStorage.key(i);
			if (!key || known.has(key)) continue;
			otherBytes += utf16Bytes(localStorage.getItem(key));
			otherKeys += 1;
		}
	} catch {
		otherBytes = 0;
		otherKeys = 0;
	}

	const categories: StorageCategory[] = [
		{
			id: 'files',
			label: 'Files & Finder',
			bytes: filesBytes,
			itemCount: filesCount,
			colorClass: 'bg-ios-blue',
			appId: 'finder',
		},
		{
			id: 'photos',
			label: 'Photos',
			bytes: photosBytes,
			itemCount: photosCount,
			colorClass: 'bg-[#ff375f]',
			appId: 'photos',
		},
		{
			id: 'notes',
			label: 'Notes',
			bytes: notesBytes,
			itemCount: notesCount,
			colorClass: 'bg-[#ff9f0a]',
			appId: 'notes',
		},
		{
			id: 'other',
			label: 'System & Preferences',
			bytes: otherBytes,
			itemCount: otherKeys,
			colorClass: 'bg-gray-400',
		},
	];

	const totalBytes = categories.reduce((sum, c) => sum + c.bytes, 0);
	const totalItems = filesCount + photosCount + notesCount;

	return {
		totalBytes,
		budgetBytes: STORAGE_BUDGET_BYTES,
		totalItems,
		categories,
	};
}

export function formatStorageSummary(breakdown: StorageBreakdown): string {
	return `${breakdown.totalItems} items · ${formatFileSize(breakdown.totalBytes)}`;
}
