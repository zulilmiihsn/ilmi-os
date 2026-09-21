import { FileItem } from '../../../utils/fileSystem';

export interface SidebarSection {
	title: string;
	items: {
		id: string;
		name: string;
		icon: string;
		folderId: string | null;
	}[];
}

export type DialogType = 'createFolder' | 'createFile' | 'rename' | 'delete' | 'preview' | null;

export interface DialogState {
	type: DialogType;
	targetItem?: FileItem;
}
