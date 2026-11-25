export type { PhotoSource, StoredPhoto as LocalPhoto } from '../../../utils/photoStorage';

export type PhotosTab = 'library' | 'foryou' | 'albums' | 'search';
export type ViewMode = 'years' | 'months' | 'days' | 'all';
export type AlbumId = 'Recents' | 'Favorites' | 'Camera' | 'Imports';

export interface Album {
	id: AlbumId;
	title: string;
	count: number;
	image: string | null;
}
