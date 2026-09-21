import type { FileItem as SharedFileItem } from '../../../utils/fileSystem';

/** Files renders shared filesystem records plus a display-only item count. */
export type FileItem = SharedFileItem & {
	itemCount?: string;
};

export interface FolderPath {
	id: string | null;
	name: string;
}
