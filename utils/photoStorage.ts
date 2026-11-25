export const PHOTO_STORAGE_KEY = 'camera_photos';

/**
 * Same-document notification for photo storage mutations. The native `storage`
 * event only fires in *other* documents, so an open Photos window next to
 * Camera stays in sync via this custom event.
 */
export const PHOTOS_CHANGED_EVENT = 'ilmi:photos-changed';

export type PhotoSource = 'camera' | 'import';

export interface StoredPhoto {
	id: string;
	url: string;
	date: string;
	type: 'photo' | 'video';
	source?: PhotoSource;
	isFavorite?: boolean;
	title?: string;
}

export type PhotoLoadResult =
	| { status: 'absent'; photos: StoredPhoto[] }
	| { status: 'ok'; photos: StoredPhoto[]; skippedCount: number }
	| { status: 'corrupted'; photos: StoredPhoto[]; message: string }
	| { status: 'unavailable'; photos: StoredPhoto[]; message: string };

export type PhotoWriteResult =
	| { ok: true }
	| { ok: false; reason: 'corrupted' | 'quota' | 'security' | 'unknown'; message: string };

export const MAX_PHOTO_DIMENSION = 1280;
export const PHOTO_JPEG_QUALITY = 0.82;

function notifyPhotosChanged(): void {
	if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
	window.dispatchEvent(new CustomEvent(PHOTOS_CHANGED_EVENT));
}

export function subscribePhotosChanged(listener: () => void): () => void {
	if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
		return () => {};
	}
	const onStorage = (event: StorageEvent) => {
		if (event.key === null || event.key === PHOTO_STORAGE_KEY) {
			listener();
		}
	};
	window.addEventListener('storage', onStorage);
	window.addEventListener(PHOTOS_CHANGED_EVENT, listener);
	return () => {
		window.removeEventListener('storage', onStorage);
		window.removeEventListener(PHOTOS_CHANGED_EVENT, listener);
	};
}

export function isValidStoredPhoto(value: unknown): value is StoredPhoto {
	if (typeof value !== 'object' || value === null) return false;
	const record = value as Record<string, unknown>;
	if (typeof record.id !== 'string' || record.id.length === 0) return false;
	if (typeof record.url !== 'string' || record.url.length === 0) return false;
	if (typeof record.date !== 'string') return false;
	if (record.type !== 'photo' && record.type !== 'video') return false;
	if (record.source !== undefined && record.source !== 'camera' && record.source !== 'import') {
		return false;
	}
	if (record.isFavorite !== undefined && typeof record.isFavorite !== 'boolean') {
		return false;
	}
	if (record.title !== undefined && typeof record.title !== 'string') {
		return false;
	}
	return true;
}

/**
 * Normalize legacy `camera_photos` items that may lack `source` or `isFavorite`,
 * while validating required fields strictly.
 */
function parseStoredPhoto(value: unknown): StoredPhoto | null {
	if (typeof value !== 'object' || value === null) return null;
	const record = value as Record<string, unknown>;
	if (typeof record.url !== 'string' || record.url.length === 0) return null;

	const id = typeof record.id === 'string' && record.id.length > 0 ? record.id : null;
	if (!id) return null;

	const date = typeof record.date === 'string' ? record.date : new Date(0).toISOString();
	const type = record.type === 'video' ? 'video' : 'photo';
	const source: PhotoSource = record.source === 'import' ? 'import' : 'camera';
	const isFavorite = record.isFavorite === true;
	const title =
		typeof record.title === 'string' && record.title.length > 0 ? record.title : undefined;

	return title !== undefined
		? { id, url: record.url, date, type, source, isFavorite, title }
		: { id, url: record.url, date, type, source, isFavorite };
}

/**
 * Load photos from localStorage with explicit distinction between absent,
 * valid-empty, corrupted (left untouched), and unavailable storage.
 */
export function loadPhotos(): PhotoLoadResult {
	if (typeof window === 'undefined') {
		return { status: 'absent', photos: [] };
	}

	try {
		const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
		if (raw === null) {
			return { status: 'absent', photos: [] };
		}

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			console.warn('[Photos] stored data is not an array; preserving raw payload');
			return {
				status: 'corrupted',
				photos: [],
				message: 'Saved photo library looks corrupted. Existing data was left untouched.',
			};
		}

		const photos: StoredPhoto[] = [];
		let skippedCount = 0;
		for (const item of parsed) {
			const normalized = parseStoredPhoto(item);
			if (normalized) {
				photos.push(normalized);
			} else {
				skippedCount += 1;
			}
		}

		if (skippedCount > 0) {
			console.warn(`[Photos] skipped ${skippedCount} malformed photo record(s)`);
		}

		return { status: 'ok', photos, skippedCount };
	} catch (error) {
		if (error instanceof SyntaxError) {
			console.warn('[Photos] stored JSON is corrupted; preserving raw payload');
			return {
				status: 'corrupted',
				photos: [],
				message: 'Saved photo library looks corrupted. Existing data was left untouched.',
			};
		}
		console.warn('[Photos] storage is unavailable', error);
		return {
			status: 'unavailable',
			photos: [],
			message: 'Photo storage is not available in this browser session.',
		};
	}
}

function classifyWriteError(error: unknown): PhotoWriteResult {
	if (
		error instanceof DOMException &&
		(error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
	) {
		return {
			ok: false,
			reason: 'quota',
			message: 'Storage full! Delete some photos, then try again.',
		};
	}
	if (
		error instanceof DOMException &&
		(error.name === 'SecurityError' || error.name === 'NotAllowedError')
	) {
		return {
			ok: false,
			reason: 'security',
			message: 'Storage is not available in this browser session.',
		};
	}
	return {
		ok: false,
		reason: 'unknown',
		message: 'Could not save photos. Changes were not stored.',
	};
}

export function savePhotos(photos: StoredPhoto[]): PhotoWriteResult {
	if (typeof window === 'undefined') {
		return {
			ok: false,
			reason: 'security',
			message: 'Storage is not available in this environment.',
		};
	}

	try {
		localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
		notifyPhotosChanged();
		return { ok: true };
	} catch (error) {
		console.error('[Photos] failed to persist photos', error);
		return classifyWriteError(error);
	}
}

/**
 * Prepend a new photo to storage. Refuses to overwrite corrupted payloads so
 * unparsed user data is never silently destroyed.
 */
export function appendPhoto(photo: StoredPhoto): PhotoWriteResult {
	const loaded = loadPhotos();
	if (loaded.status === 'corrupted') {
		return {
			ok: false,
			reason: 'corrupted',
			message: 'Saved photos look corrupted. Previously saved photos were kept.',
		};
	}
	if (loaded.status === 'unavailable') {
		return {
			ok: false,
			reason: 'security',
			message: loaded.message,
		};
	}
	return savePhotos([photo, ...loaded.photos]);
}

export function togglePhotoFavorite(id: string): PhotoWriteResult {
	const loaded = loadPhotos();
	if (loaded.status !== 'ok') {
		return {
			ok: false,
			reason: loaded.status === 'corrupted' ? 'corrupted' : 'unknown',
			message:
				loaded.status === 'corrupted' || loaded.status === 'unavailable'
					? loaded.message
					: 'Photo not found.',
		};
	}
	const next = loaded.photos.map(photo =>
		photo.id === id ? { ...photo, isFavorite: !photo.isFavorite } : photo
	);
	return savePhotos(next);
}

export function deletePhoto(id: string): PhotoWriteResult {
	const loaded = loadPhotos();
	if (loaded.status !== 'ok') {
		return {
			ok: false,
			reason: loaded.status === 'corrupted' ? 'corrupted' : 'unknown',
			message:
				loaded.status === 'corrupted' || loaded.status === 'unavailable'
					? loaded.message
					: 'Photo not found.',
		};
	}
	const next = loaded.photos.filter(photo => photo.id !== id);
	return savePhotos(next);
}

/**
 * Fit dimensions within `maxDimension` while preserving aspect ratio.
 * Never upscales smaller images.
 */
export function computeScaledDimensions(
	width: number,
	height: number,
	maxDimension: number = MAX_PHOTO_DIMENSION
): { width: number; height: number } {
	if (width <= 0 || height <= 0 || maxDimension <= 0) {
		return { width: 0, height: 0 };
	}
	const longest = Math.max(width, height);
	if (longest <= maxDimension) {
		return { width: Math.round(width), height: Math.round(height) };
	}
	const scale = maxDimension / longest;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

/**
 * Read a user-selected image File and compress it to a JPEG data URL suitable
 * for localStorage persistence.
 */
export function compressImageFile(
	file: File,
	maxDimension: number = MAX_PHOTO_DIMENSION,
	quality: number = PHOTO_JPEG_QUALITY
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Could not read image file.'));
		reader.onload = () => {
			const dataUrl = typeof reader.result === 'string' ? reader.result : '';
			if (!dataUrl) {
				reject(new Error('Image file is empty.'));
				return;
			}
			const img = new window.Image();
			img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
			img.onload = () => {
				const target = computeScaledDimensions(img.naturalWidth, img.naturalHeight, maxDimension);
				if (target.width === 0 || target.height === 0) {
					reject(new Error('Image has invalid dimensions.'));
					return;
				}
				const canvas = document.createElement('canvas');
				canvas.width = target.width;
				canvas.height = target.height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve(dataUrl);
					return;
				}
				ctx.drawImage(img, 0, 0, target.width, target.height);
				resolve(canvas.toDataURL('image/jpeg', quality));
			};
			img.src = dataUrl;
		};
		reader.readAsDataURL(file);
	});
}
