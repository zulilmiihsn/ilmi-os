export interface Note {
	id: string;
	title: string;
	content: string;
	date: Date;
	folder: string;
	hasImage?: boolean;
	imageSrc?: string;
	tags?: string[];
	selected?: boolean;
}

export type NoteView = 'list' | 'detail';
