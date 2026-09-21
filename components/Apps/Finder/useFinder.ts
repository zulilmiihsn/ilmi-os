'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	loadFileSystem,
	createFolder as fsCreateFolder,
	createFile as fsCreateFile,
	deleteItem as fsDeleteItem,
	renameItem as fsRenameItem,
	getBreadcrumbs,
	FileItem,
} from '../../../utils/fileSystem';
import { DialogState, SidebarSection } from './types';

export function useFinder() {
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [history, setHistory] = useState<(string | null)[]>([null]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

	// File system items from shared storage
	const [allItems, setAllItems] = useState<FileItem[]>([]);

	// Dialog states
	const [dialog, setDialog] = useState<DialogState>({ type: null });
	const [dialogInput, setDialogInput] = useState('');
	const [dialogError, setDialogError] = useState<string | null>(null);

	// Refresh file system
	const refreshItems = useCallback(() => {
		const fs = loadFileSystem();
		setAllItems(fs.items);
	}, []);

	useEffect(() => {
		refreshItems();
		const handleStorage = () => refreshItems();
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, [refreshItems]);

	useEffect(() => {
		setDialogError(null);
	}, [dialog.type]);

	// Navigation handlers
	const navigateTo = useCallback(
		(folderId: string | null) => {
			if (folderId === currentFolderId) return;
			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(folderId);
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);
			setCurrentFolderId(folderId);
			setSelectedItemId(null);
		},
		[currentFolderId, history, historyIndex]
	);

	const goBack = useCallback(() => {
		if (historyIndex > 0) {
			const newIndex = historyIndex - 1;
			setHistoryIndex(newIndex);
			setCurrentFolderId(history[newIndex]);
			setSelectedItemId(null);
		}
	}, [history, historyIndex]);

	const goForward = useCallback(() => {
		if (historyIndex < history.length - 1) {
			const newIndex = historyIndex + 1;
			setHistoryIndex(newIndex);
			setCurrentFolderId(history[newIndex]);
			setSelectedItemId(null);
		}
	}, [history, historyIndex]);

	// Current items in folder
	const currentItems = useMemo(() => {
		if (searchQuery.trim()) {
			return allItems.filter(item =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
			);
		}
		return allItems.filter(item => item.parentId === currentFolderId);
	}, [allItems, currentFolderId, searchQuery]);

	// Current breadcrumbs
	const breadcrumbs = useMemo(() => {
		return getBreadcrumbs(currentFolderId);
	}, [currentFolderId]);

	// Selected item details
	const selectedItem = useMemo(() => {
		return allItems.find(i => i.id === selectedItemId);
	}, [allItems, selectedItemId]);

	// Sidebar configuration
	const sidebarSections: SidebarSection[] = useMemo(() => {
		const findId = (name: string) =>
			allItems.find(i => i.type === 'folder' && i.name.toLowerCase() === name.toLowerCase())?.id ||
			null;

		return [
			{
				title: 'Favorites',
				items: [
					{ id: 'desktop', name: 'Desktop', icon: 'desktop', folderId: findId('Desktop') },
					{ id: 'documents', name: 'Documents', icon: 'file-text', folderId: findId('Documents') },
					{ id: 'downloads', name: 'Downloads', icon: 'download', folderId: findId('Downloads') },
					{ id: 'pictures', name: 'Pictures', icon: 'image', folderId: findId('Pictures') },
				],
			},
		];
	}, [allItems]);

	const failDialog = useCallback((message: string) => {
		setDialogError(message);
	}, []);

	// Dialog action triggers: dialogs stay open with an error when the
	// change could not be persisted, so input is never silently dropped.
	const handleCreateFolder = useCallback(() => {
		if (!dialogInput.trim()) return;
		if (!fsCreateFolder(dialogInput.trim(), currentFolderId)) {
			failDialog('Could not save the new folder. Storage may be unavailable or full.');
			return;
		}
		setDialogError(null);
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	}, [dialogInput, currentFolderId, refreshItems, failDialog]);

	const handleCreateFile = useCallback(() => {
		if (!dialogInput.trim()) return;
		if (!fsCreateFile(dialogInput.trim(), currentFolderId, 'New file content')) {
			failDialog('Could not save the new file. Storage may be unavailable or full.');
			return;
		}
		setDialogError(null);
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	}, [dialogInput, currentFolderId, refreshItems, failDialog]);

	const handleRename = useCallback(() => {
		if (!dialog.targetItem || !dialogInput.trim()) return;
		if (!fsRenameItem(dialog.targetItem.id, dialogInput.trim())) {
			failDialog('Could not rename the item. Storage may be unavailable.');
			return;
		}
		setDialogError(null);
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	}, [dialog.targetItem, dialogInput, refreshItems, failDialog]);

	const handleDelete = useCallback(() => {
		if (!dialog.targetItem) return;
		if (!fsDeleteItem(dialog.targetItem.id)) {
			failDialog('Could not delete the item. Storage may be unavailable.');
			return;
		}
		setDialogError(null);
		if (selectedItemId === dialog.targetItem.id) {
			setSelectedItemId(null);
		}
		setDialog({ type: null });
		refreshItems();
	}, [dialog.targetItem, selectedItemId, refreshItems, failDialog]);

	return {
		currentFolderId,
		history,
		historyIndex,
		selectedItemId,
		setSelectedItemId,
		searchQuery,
		setSearchQuery,
		viewMode,
		setViewMode,
		allItems,
		dialog,
		setDialog,
		dialogInput,
		setDialogInput,
		dialogError,
		navigateTo,
		goBack,
		goForward,
		currentItems,
		breadcrumbs,
		selectedItem,
		sidebarSections,
		handleCreateFolder,
		handleCreateFile,
		handleRename,
		handleDelete,
	};
}
