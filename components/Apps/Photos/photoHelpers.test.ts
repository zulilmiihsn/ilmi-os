import { describe, it, expect } from 'vitest';
import type { StoredPhoto } from '../../../utils/photoStorage';
import {
	buildPhotoAlbums,
	filterPhotosByAlbum,
	filterPhotosBySearch,
	resolveDisplayedPhotos,
} from './photoHelpers';

const SAMPLE_PHOTOS: StoredPhoto[] = [
	{
		id: 'p-1',
		url: 'data:image/jpeg;base64,AAA',
		date: '2026-11-25T09:00:00.000Z',
		type: 'photo',
		source: 'camera',
		isFavorite: true,
	},
	{
		id: 'p-2',
		url: 'data:image/jpeg;base64,BBB',
		date: '2026-10-12T15:30:00.000Z',
		type: 'photo',
		source: 'import',
		isFavorite: false,
		title: 'bali-beach.jpg',
	},
];

describe('photoHelpers', () => {
	it('builds albums with real counts and null covers when empty', () => {
		const emptyAlbums = buildPhotoAlbums([]);
		expect(emptyAlbums.every(a => a.count === 0 && a.image === null)).toBe(true);

		const albums = buildPhotoAlbums(SAMPLE_PHOTOS);
		expect(albums).toEqual([
			{ id: 'Recents', title: 'Recents', count: 2, image: 'data:image/jpeg;base64,AAA' },
			{ id: 'Favorites', title: 'Favorites', count: 1, image: 'data:image/jpeg;base64,AAA' },
			{ id: 'Camera', title: 'Camera', count: 1, image: 'data:image/jpeg;base64,AAA' },
			{ id: 'Imports', title: 'Imports', count: 1, image: 'data:image/jpeg;base64,BBB' },
		]);
	});

	it('filters photos by album and search query', () => {
		expect(filterPhotosByAlbum(SAMPLE_PHOTOS, 'Favorites').map(p => p.id)).toEqual(['p-1']);
		expect(filterPhotosByAlbum(SAMPLE_PHOTOS, 'Imports').map(p => p.id)).toEqual(['p-2']);
		expect(filterPhotosByAlbum(SAMPLE_PHOTOS, 'Camera').map(p => p.id)).toEqual(['p-1']);

		expect(filterPhotosBySearch(SAMPLE_PHOTOS, 'bali').map(p => p.id)).toEqual(['p-2']);
		expect(filterPhotosBySearch(SAMPLE_PHOTOS, 'favorite').map(p => p.id)).toEqual(['p-1']);
		expect(filterPhotosBySearch(SAMPLE_PHOTOS, 'camera').map(p => p.id)).toEqual(['p-1']);
		expect(filterPhotosBySearch(SAMPLE_PHOTOS, 'nonexistent')).toEqual([]);
	});

	it('resolves displayed photos for each tab', () => {
		expect(resolveDisplayedPhotos(SAMPLE_PHOTOS, 'library', null, '').map(p => p.id)).toEqual([
			'p-1',
			'p-2',
		]);
		expect(resolveDisplayedPhotos(SAMPLE_PHOTOS, 'foryou', null, '').map(p => p.id)).toEqual([
			'p-1',
		]);
		expect(resolveDisplayedPhotos(SAMPLE_PHOTOS, 'search', null, 'import').map(p => p.id)).toEqual([
			'p-2',
		]);
	});
});
