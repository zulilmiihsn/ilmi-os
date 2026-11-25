import type { StoredPhoto } from '../../../utils/photoStorage';
import type { Album, AlbumId, PhotosTab } from './types';

export function buildPhotoAlbums(photos: StoredPhoto[]): Album[] {
	const favorites = photos.filter(p => p.isFavorite);
	const cameraShots = photos.filter(p => p.source !== 'import');
	const imports = photos.filter(p => p.source === 'import');

	return [
		{
			id: 'Recents',
			title: 'Recents',
			count: photos.length,
			image: photos[0]?.url ?? null,
		},
		{
			id: 'Favorites',
			title: 'Favorites',
			count: favorites.length,
			image: favorites[0]?.url ?? null,
		},
		{
			id: 'Camera',
			title: 'Camera',
			count: cameraShots.length,
			image: cameraShots[0]?.url ?? null,
		},
		{
			id: 'Imports',
			title: 'Imports',
			count: imports.length,
			image: imports[0]?.url ?? null,
		},
	];
}

export function formatPhotoDate(isoDate: string): string {
	const parsed = new Date(isoDate);
	if (Number.isNaN(parsed.getTime())) return 'Unknown Date';
	return parsed.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export function formatPhotoDateTime(isoDate: string): string {
	const parsed = new Date(isoDate);
	if (Number.isNaN(parsed.getTime())) return 'Unknown Date';
	return parsed.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

export function filterPhotosByAlbum(photos: StoredPhoto[], album: AlbumId | null): StoredPhoto[] {
	switch (album) {
		case 'Favorites':
			return photos.filter(p => p.isFavorite);
		case 'Camera':
			return photos.filter(p => p.source !== 'import');
		case 'Imports':
			return photos.filter(p => p.source === 'import');
		case 'Recents':
		case null:
			return photos;
	}
}

export function filterPhotosBySearch(photos: StoredPhoto[], query: string): StoredPhoto[] {
	const trimmed = query.trim().toLowerCase();
	if (!trimmed) return photos;

	return photos.filter(photo => {
		const dateText = formatPhotoDate(photo.date).toLowerCase();
		const sourceText = (photo.source ?? 'camera').toLowerCase();
		const titleText = (photo.title ?? '').toLowerCase();
		const favText = photo.isFavorite ? 'favorite favorites liked' : '';
		return (
			dateText.includes(trimmed) ||
			sourceText.includes(trimmed) ||
			titleText.includes(trimmed) ||
			favText.includes(trimmed)
		);
	});
}

export function resolveDisplayedPhotos(
	photos: StoredPhoto[],
	activeTab: PhotosTab,
	selectedAlbum: AlbumId | null,
	searchQuery: string
): StoredPhoto[] {
	if (selectedAlbum !== null) {
		return filterPhotosByAlbum(photos, selectedAlbum);
	}
	if (activeTab === 'foryou') {
		const favorites = photos.filter(p => p.isFavorite);
		return favorites.length > 0 ? favorites : photos.slice(0, 6);
	}
	if (activeTab === 'search') {
		return filterPhotosBySearch(photos, searchQuery);
	}
	return photos;
}
