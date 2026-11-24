export interface FileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	parentId: string | null; // null for root items
	size?: number; // in bytes
	modified: string; // ISO date string
	created: string; // ISO date string
	icon?: string;
	content?: string; // for text files
}

export interface FileSystemData {
	items: FileItem[];
	lastModified: string;
}
