'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import { TIMING } from '../../../constants';
import {
	createFolder,
	deleteItem,
	renameItem,
	formatFileSize,
	getItemCount,
	getItemsInFolder,
	loadFileSystem,
} from '../../../utils/fileSystem';

import type { FileItem, FolderPath } from './types';
import { migrateLegacyFilesStorage } from './utils';
import {
	CreateFolderDialog,
	RenameDialog,
	DeleteConfirmDialog,
	ActionMenu,
	ActionSheet,
} from './Modals';

import TabBar from './TabBar';

export default function Files() {
	const { darkMode } = useSettingsStore();

	const [mounted, setMounted] = useState(false);
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [folderPath, setFolderPath] = useState<FolderPath[]>([{ id: null, name: 'On My iPhone' }]);
	const [activeTab, setActiveTab] = useState<'recents' | 'shared' | 'browse'>('browse');
	const [searchQuery, setSearchQuery] = useState('');
	const [items, setItems] = useState<FileItem[]>([]);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [selectedItemName, setSelectedItemName] = useState('');
	const [showActionSheet, setShowActionSheet] = useState(false);
	const [showActionMenu, setShowActionMenu] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [renameValue, setRenameValue] = useState('');
	const [persistError, setPersistError] = useState<string | null>(null);

	// Long press state
	const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const timer = longPressTimer;
		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [longPressTimer]);

	// Navigation animation state
	const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back' | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);

	// Migrate the legacy flat store once, then mount to prevent hydration errors
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
		const folderItems = getItemsInFolder(currentFolderId);
		setItems(folderItems);
	}, [mounted, currentFolderId]);

	// Load items when folder changes (only after mounted)
	useEffect(() => {
		if (mounted && activeTab === 'browse') {
			loadItems();
		}
	}, [currentFolderId, mounted, activeTab, loadItems]);

	const filteredItems = useMemo(() => {
		if (activeTab === 'recents') {
			// Show recently modified items (last 7 days)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const allItems = loadFileSystem().items;
			return allItems
				.filter((item: FileItem) => new Date(item.modified) >= sevenDaysAgo)
				.sort(
					(a: FileItem, b: FileItem) =>
						new Date(b.modified).getTime() - new Date(a.modified).getTime()
				)
				.slice(0, 20); // Limit to 20 items
		} else if (activeTab === 'shared') {
			// For now, return empty array (could implement sharing functionality later)
			return [];
		} else {
			// Browse tab - normal filtering
			if (!searchQuery) return items;
			return items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
		}
	}, [items, searchQuery, activeTab]);

	const sortedItems = useMemo(() => {
		if (activeTab === 'recents') {
			// Already sorted by date in filteredItems
			return filteredItems;
		}

		return [...filteredItems].sort((a, b) => {
			// Folders first, then files
			if (a.type !== b.type) {
				return a.type === 'folder' ? -1 : 1;
			}
			// Then alphabetically
			return a.name.localeCompare(b.name);
		});
	}, [filteredItems, activeTab]);

	// Get enriched items with item count for folders
	const enrichedItems = useMemo(() => {
		return sortedItems.map((item: FileItem) => {
			if (item.type === 'folder') {
				return {
					...item,
					itemCount: `${getItemCount(item.id)} items`,
				};
			}
			return item;
		});
	}, [sortedItems]);

	function handleItemClick(item: FileItem) {
		if (item.type === 'folder' && activeTab === 'browse') {
			// Navigate into folder with forward animation
			setNavigationDirection('forward');
			setIsAnimating(true);

			setTimeout(() => {
				setCurrentFolderId(item.id);
				setFolderPath([...folderPath, { id: item.id, name: item.name }]);
				setSearchQuery('');
				setIsAnimating(false);
			}, 150);
		} else {
			// Handle file click (could open preview, etc.)
			setSelectedItemId(item.id);
		}
	}

	function handleBack() {
		if (folderPath.length > 1) {
			// Navigate back with back animation
			setNavigationDirection('back');
			setIsAnimating(true);

			setTimeout(() => {
				const newPath = folderPath.slice(0, -1);
				setFolderPath(newPath);
				setCurrentFolderId(newPath[newPath.length - 1].id);
				setSearchQuery('');
				setIsAnimating(false);
			}, 150);
		}
	}

	function handleTabChange(tab: 'recents' | 'shared' | 'browse') {
		setActiveTab(tab);
		setSearchQuery('');

		// Reset to root when switching to browse
		if (tab === 'browse' && folderPath.length > 1) {
			setFolderPath([{ id: null, name: 'On My iPhone' }]);
			setCurrentFolderId(null);
		}
	}

	function handleCreateFolder() {
		if (!newFolderName.trim()) return;

		if (!createFolder(newFolderName.trim(), currentFolderId)) {
			setPersistError('Could not save the new folder. Storage may be unavailable or full.');
			return;
		}
		setPersistError(null);

		setNewFolderName('');
		setShowCreateDialog(false);
		loadItems();
	}

	function handleDelete() {
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
	}

	function handleRename() {
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
	}

	function handleLongPress(item: FileItem) {
		if (navigator.vibrate) navigator.vibrate(50);
		setSelectedItemId(item.id);
		setSelectedItemName(item.name);
		setShowActionSheet(true);
	}

	const currentPathName = folderPath[folderPath.length - 1].name;

	if (!mounted) return null;

	// Theme Objects
	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-ios-gray6',
		text: darkMode ? 'text-white' : 'text-black',
		textSecondary: darkMode ? 'text-ios-gray' : 'text-gray-700',
		textMuted: 'text-ios-gray',
		headerBg: darkMode ? 'bg-black border-ios-dark-separator' : 'bg-white border-ios-separator',
		searchBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-ios-gray5',
		searchPlaceholder: darkMode ? 'placeholder-gray-500' : 'placeholder-gray-500',
		itemBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-white',
		itemIconFolder: 'text-ios-blue',
		itemIconFile: 'text-ios-gray',
		tabBarBg: darkMode ? 'bg-black border-ios-dark-separator' : 'bg-white border-ios-separator',
		activeTab: 'text-ios-blue',
		inactiveTab: darkMode ? 'text-ios-gray' : 'text-gray-500',
		tabHighlight: 'bg-ios-blue/20',
		actionMenuBg: darkMode ? 'bg-ios-dark-gray5/70 border-gray-700' : 'bg-white/95 border-white/20',
		modalBg: darkMode ? 'bg-ios-dark-gray6/90' : 'bg-white/90',
		modalInputBg: darkMode ? 'bg-ios-dark-gray5 text-white' : 'bg-ios-gray6 text-black',
	};

	return (
		<div
			className={`files-app w-full h-full flex flex-col overflow-hidden font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					{persistError}
				</div>
			)}
			{/* Header */}
			<div className={`shrink-0 border-b transition-colors ${theme.headerBg}`}>
				{/* Top Navigation */}
				<div className="relative flex items-center justify-between px-4 pt-6 pb-2">
					{/* Left Side */}
					<div className="flex-1 flex items-center">
						{activeTab === 'browse' && folderPath.length > 1 ? (
							<button
								onClick={handleBack}
								className="flex items-center text-ios-blue text-base font-medium"
							>
								<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								Browse
							</button>
						) : null}
					</div>

					{/* Center Title */}
					<h1
						className={`text-lg font-semibold text-center mx-2 truncate max-w-[60%] ${theme.text}`}
					>
						{activeTab === 'recents'
							? 'Recents'
							: activeTab === 'shared'
								? 'Shared'
								: currentPathName}
					</h1>

					{/* Right Side */}
					<div className="flex-1 flex items-center justify-end">
						<button
							onClick={() => setShowActionMenu(true)}
							className="w-8 h-8 flex items-center justify-center"
						>
							<svg
								className={`w-5 h-5 ${darkMode ? 'text-ios-blue' : 'text-ios-blue'}`}
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
							</svg>
						</button>
					</div>
				</div>

				{/* Search Bar */}
				<div className="px-4 pb-3">
					<div className={`relative flex items-center rounded-lg px-3 py-2 ${theme.searchBg}`}>
						<svg
							className="w-4 h-4 text-gray-500 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							placeholder="Search"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className={`flex-1 bg-transparent border-none outline-none text-sm ${theme.text} ${theme.searchPlaceholder}`}
						/>
						<button className="ml-2">
							<svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 relative overflow-hidden">
				{/* Animation Container */}
				<div
					className={`absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden transition-transform duration-250 ease-in-out ${
						isAnimating
							? navigationDirection === 'forward'
								? 'animate-slide-out-left'
								: 'animate-slide-out-right'
							: 'animate-slide-in'
					}`}
				>
					{/* Empty States */}
					{activeTab === 'shared' && enrichedItems.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
							<svg
								className="w-16 h-16 mb-4 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>No Shared Files</h3>
							<p className="text-sm">Files and folders shared with you will appear here.</p>
						</div>
					)}

					{activeTab === 'recents' && enrichedItems.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
							<svg
								className="w-16 h-16 mb-4 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>No Recent Files</h3>
							<p className="text-sm">Files you've opened recently will appear here.</p>
						</div>
					)}

					{activeTab === 'browse' && enrichedItems.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
							<svg
								className="w-16 h-16 mb-4 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								/>
							</svg>
							<h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Empty Folder</h3>
							<button
								onClick={() => setShowCreateDialog(true)}
								className="mt-4 px-4 py-2 bg-ios-blue text-white rounded-lg font-medium active:bg-blue-600 transition-colors"
							>
								Create Folder
							</button>
						</div>
					)}

					{/* File List */}
					{enrichedItems.length > 0 && (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4 p-4 w-full">
							{enrichedItems.map((item: FileItem) => (
								<div
									key={item.id}
									className="flex flex-col items-center group"
									onClick={() => handleItemClick(item)}
									onContextMenu={e => {
										e.preventDefault();
										handleLongPress(item);
									}}
									onTouchStart={() => {
										const timer = setTimeout(() => handleLongPress(item), TIMING.LONG_PRESS_FILES);
										setLongPressTimer(timer);
									}}
									onTouchMove={() => {
										if (longPressTimer) {
											clearTimeout(longPressTimer);
											setLongPressTimer(null);
										}
									}}
									onTouchEnd={() => {
										if (longPressTimer) clearTimeout(longPressTimer);
									}}
								>
									<div
										className={`w-16 h-16 mb-2 flex items-center justify-center rounded-xl shadow-sm group-active:scale-95 transition-all ${theme.itemBg}`}
									>
										{item.type === 'folder' ? (
											<svg
												className={`w-10 h-10 ${theme.itemIconFolder}`}
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
											</svg>
										) : (
											<svg
												className={`w-10 h-10 ${theme.itemIconFile}`}
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
											</svg>
										)}
									</div>
									<span
										className={`text-xs text-center font-medium truncate w-full px-1 ${theme.textSecondary}`}
									>
										{item.name}
									</span>
									<span className={`text-[10px] ${theme.textMuted}`}>
										{item.type === 'folder'
											? item.itemCount
											: typeof item.size === 'number'
												? formatFileSize(item.size)
												: item.size}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Bottom Tab Bar */}
			<TabBar activeTab={activeTab} onTabChange={handleTabChange} darkMode={darkMode} />

			{/* Create Folder Dialog */}
			<CreateFolderDialog
				isOpen={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
				onCreate={handleCreateFolder}
				folderName={newFolderName}
				onFolderNameChange={setNewFolderName}
				darkMode={darkMode}
			/>

			{/* Action Menu (Dropdown) */}
			<ActionMenu
				isOpen={showActionMenu}
				onClose={() => setShowActionMenu(false)}
				onNewFolder={() => {
					setShowActionMenu(false);
					setShowCreateDialog(true);
				}}
				darkMode={darkMode}
			/>

			{/* Action Sheet (Long press item) */}
			<ActionSheet
				isOpen={showActionSheet}
				onClose={() => setShowActionSheet(false)}
				itemName={selectedItemName}
				onRename={() => {
					setShowRenameDialog(true);
					setRenameValue(selectedItemName);
					setShowActionSheet(false);
				}}
				onDelete={() => {
					setShowDeleteConfirm(true);
					setShowActionSheet(false);
				}}
				darkMode={darkMode}
			/>

			{/* Delete Confirmation */}
			<DeleteConfirmDialog
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				darkMode={darkMode}
			/>

			{/* Rename Dialog */}
			<RenameDialog
				isOpen={showRenameDialog}
				onClose={() => setShowRenameDialog(false)}
				onRename={handleRename}
				value={renameValue}
				onValueChange={setRenameValue}
				darkMode={darkMode}
			/>
		</div>
	);
}
