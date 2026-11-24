/**
 * File System Utilities using localStorage
 * Manages file and folder structure in browser storage
 */

export type { FileItem, FileSystemData } from './fileSystem/types';
export {
	FILE_SYSTEM_CHANGED_EVENT,
	subscribeFileSystemChanged,
	isValidFileSystemData,
	loadFileSystem,
	saveFileSystem,
	resetFileSystem,
} from './fileSystem/storage';
export {
	getItemsInFolder,
	getItemById,
	createFolder,
	createFile,
	deleteItem,
	renameItem,
	moveItem,
	getItemCount,
	searchItems,
	updateFileContent,
} from './fileSystem/operations';
export {
	formatFileSize,
	formatDate,
	getBreadcrumbs,
	resolveFolderPath,
} from './fileSystem/paths';
