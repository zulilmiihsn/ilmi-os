import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import {
	createFolder,
	createFile,
	deleteItem,
	renameItem,
	getItemCount,
	getItemsInFolder,
	loadFileSystem,
	subscribeFileSystemChanged,
} from '../../../utils/fileSystem';
import type { FileItem, FolderPath } from './types';
import { migrateLegacyFilesStorage } from './utils';

export type SortMode = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';
const SORT_ORDER: SortMode[] = ['name-asc', 'name-desc', 'date-desc', 'date-asc'];
export const SORT_LABELS: Record<SortMode, string> = {
	'name-asc': 'Name A–Z',
	'name-desc': 'Name Z–A',
	'date-desc': 'Newest first',
	'date-asc': 'Oldest first',
};

export function useFilesState() {
	const [mounted, setMounted] = useState(false);
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [folderPath, setFolderPath] = useState<FolderPath[]>([{ id: null, name: 'On My iPhone' }]);
	const [activeTab, setActiveTab] = useState<'recents' | 'shared' | 'browse'>('browse');
	const [searchQuery, setSearchQuery] = useState('');
	const [items, setItems] = useState<FileItem[]>([]);
	const [sortMode, setSortMode] = useState<SortMode>('name-asc');
	const cycleSortMode = useCallback(() => {
		triggerHaptic('light');
		setSortMode(
			prev => SORT_ORDER[(SORT_ORDER.indexOf(prev) + 1) % SORT_ORDER.length] ?? 'name-asc'
		);
	}, []);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [selectedItemName, setSelectedItemName] = useState('');
	const [showActionSheet, setShowActionSheet] = useState(false);
	const [showActionMenu, setShowActionMenu] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [renameValue, setRenameValue] = useState('');
	const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
	const [fsVersion, setFsVersion] = useState(0);
	const [persistError, setPersistError] = useState<string | null>(null);
	const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
	const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back' | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const timer = longPressTimer;
		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [longPressTimer]);

	useEffect(() => {
		const result = migrateLegacyFilesStorage();
		if (result === 'persist-failed') {
			setPersistError('Could not migrate previous Files data. Storage may be unavailable.');
		} else if (result === 'shared-invalid' || result === 'legacy-invalid') {
			setPersistError('Previous Files data could not be read and was left untouched.');
		}
		setMounted(true);
	}, []);

	const loadItems = useCallback(() => {
		if (!mounted) return;
		setItems(getItemsInFolder(currentFolderId));
		setFsVersion(v => v + 1);
	}, [mounted, currentFolderId]);

	useEffect(() => {
		if (!mounted) return;
		return subscribeFileSystemChanged(loadItems);
	}, [mounted, loadItems]);

	const handleUploadFiles = useCallback(
		async (list: FileList | null) => {
			if (!list || list.length === 0) return;
			triggerHaptic('medium');
			let failed = false;
			for (const f of Array.from(list)) {
				const isText =
					f.type.startsWith('text/') ||
					/\.(txt|md|json|csv|log|xml|html?|css|js|ts|tsx)$/i.test(f.name);
				const content = isText ? await f.text().catch(() => '') : '';
				if (!createFile(f.name, currentFolderId, content, f.size)) failed = true;
			}
			if (failed) {
				setPersistError('Could not save uploaded file(s). Storage may be unavailable.');
			}
			loadItems();
		},
		[currentFolderId, loadItems]
	);

	useEffect(() => {
		if (mounted && activeTab === 'browse') {
			loadItems();
		}
	}, [currentFolderId, mounted, activeTab, loadItems]);

	const filteredItems = useMemo(() => {
		void fsVersion;
		if (activeTab === 'recents') {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const allItems = loadFileSystem().items;
			const recent = allItems
				.filter((item: FileItem) => new Date(item.modified) >= sevenDaysAgo)
				.sort(
					(a: FileItem, b: FileItem) =>
						new Date(b.modified).getTime() - new Date(a.modified).getTime()
				)
				.slice(0, 20);
			if (!searchQuery) return recent;
			return recent.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
		}
		if (activeTab === 'shared') return [];
		if (!searchQuery) return items;
		return items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [items, searchQuery, activeTab, fsVersion]);

	const sortedItems = useMemo(() => {
		if (activeTab === 'recents') return filteredItems;
		return [...filteredItems].sort((a, b) => {
			if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
			switch (sortMode) {
				case 'name-desc':
					return b.name.localeCompare(a.name);
				case 'date-desc':
					return new Date(b.modified).getTime() - new Date(a.modified).getTime();
				case 'date-asc':
					return new Date(a.modified).getTime() - new Date(b.modified).getTime();
				default:
					return a.name.localeCompare(b.name);
			}
		});
	}, [filteredItems, activeTab, sortMode]);

	const enrichedItems = useMemo(
		() =>
			sortedItems.map((item: FileItem) =>
				item.type === 'folder' ? { ...item, itemCount: `${getItemCount(item.id)} items` } : item
			),
		[sortedItems]
	);

	const handleItemClick = (item: FileItem) => {
		if (item.type === 'folder' && activeTab === 'browse') {
			setNavigationDirection('forward');
			setIsAnimating(true);
			setTimeout(() => {
				setCurrentFolderId(item.id);
				setFolderPath([...folderPath, { id: item.id, name: item.name }]);
				setSearchQuery('');
				setIsAnimating(false);
			}, 150);
		} else if (item.type === 'file') {
			setSelectedItemId(item.id);
			setPreviewItem(item);
		} else {
			setSelectedItemId(item.id);
		}
	};

	const handleBack = () => {
		if (folderPath.length > 1) {
			setNavigationDirection('back');
			setIsAnimating(true);
			setTimeout(() => {
				const newPath = folderPath.slice(0, -1);
				setFolderPath(newPath);
				const parent = newPath[newPath.length - 1];
				setCurrentFolderId(parent?.id ?? null);
				setSearchQuery('');
				setIsAnimating(false);
			}, 150);
		}
	};

	const handleTabChange = (tab: 'recents' | 'shared' | 'browse') => {
		setActiveTab(tab);
		setSearchQuery('');
		if (tab === 'browse' && folderPath.length > 1) {
			setFolderPath([{ id: null, name: 'On My iPhone' }]);
			setCurrentFolderId(null);
		}
	};

	const handleCreateFolder = () => {
		if (!newFolderName.trim()) return;
		if (!createFolder(newFolderName.trim(), currentFolderId)) {
			setPersistError('Could not save the new folder. Storage may be unavailable or full.');
			return;
		}
		setPersistError(null);
		setNewFolderName('');
		setShowCreateDialog(false);
		loadItems();
	};

	const handleDelete = () => {
		if (!selectedItemId) return;
		if (!deleteItem(selectedItemId)) {
			setPersistError('Could not delete the item. Storage may be unavailable.');
			return;
		}
		setPersistError(null);
		setShowDeleteConfirm(false);
		setShowActionSheet(false);
		setSelectedItemId(null);
		loadItems();
	};

	const handleRename = () => {
		if (!selectedItemId || !renameValue.trim()) return;
		if (!renameItem(selectedItemId, renameValue.trim())) {
			setPersistError('Could not rename the item. Storage may be unavailable.');
			return;
		}
		setPersistError(null);
		setShowRenameDialog(false);
		setShowActionSheet(false);
		setSelectedItemId(null);
		loadItems();
	};

	const handleLongPress = (item: FileItem) => {
		if (navigator.vibrate) navigator.vibrate(50);
		setSelectedItemId(item.id);
		setSelectedItemName(item.name);
		setShowActionSheet(true);
	};

	return {
		mounted,
		folderPath,
		activeTab,
		searchQuery,
		setSearchQuery,
		sortMode,
		cycleSortMode,
		showCreateDialog,
		setShowCreateDialog,
		newFolderName,
		setNewFolderName,
		selectedItemName,
		showActionSheet,
		setShowActionSheet,
		showActionMenu,
		setShowActionMenu,
		showDeleteConfirm,
		setShowDeleteConfirm,
		showRenameDialog,
		setShowRenameDialog,
		renameValue,
		setRenameValue,
		previewItem,
		setPreviewItem,
		persistError,
		longPressTimer,
		setLongPressTimer,
		navigationDirection,
		isAnimating,
		fileInputRef,
		enrichedItems,
		handleUploadFiles,
		handleItemClick,
		handleBack,
		handleTabChange,
		handleCreateFolder,
		handleDelete,
		handleRename,
		handleLongPress,
	};
}
