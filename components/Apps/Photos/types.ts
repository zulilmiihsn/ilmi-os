export type PhotosTab = 'library' | 'foryou' | 'albums' | 'search';
export type ViewMode = 'years' | 'months' | 'days' | 'all';

export interface LocalPhoto {
	id: string;
	url: string;
	date: string;
	type: 'photo' | 'video';
}

export interface Album {
	title: string;
	count: number;
	image: string;
}
