'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	loadFileSystem,
	createFolder as fsCreateFolder,
	createFile as fsCreateFile,
	deleteItem as fsDeleteItem,
	renameItem as fsRenameItem,
	formatDate,
	formatFileSize,
	getBreadcrumbs,
	FileItem,
} from '../../utils/fileSystem';

interface SidebarSection {
	title: string;
	items: {
		id: string;
		name: string;
		icon: string;
		folderId: string | null;
	}[];
}

export default function Finder() {
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [history, setHistory] = useState<(string | null)[]>([null]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

	// File system items from shared storage
	const [allItems, setAllItems] = useState<FileItem[]>([]);

	// Dialog states
	const [dialog, setDialog] = useState<{
		type: 'createFolder' | 'createFile' | 'rename' | 'delete' | 'preview' | null;
		targetItem?: FileItem;
	}>({ type: null });
	const [dialogInput, setDialogInput] = useState('');

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
			allItems.find(i => i.type === 'folder' && i.name.toLowerCase() === name.toLowerCase())
				?.id || null;

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

	// Dialog action triggers
	const handleCreateFolder = () => {
		if (!dialogInput.trim()) return;
		fsCreateFolder(dialogInput.trim(), currentFolderId);
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	};

	const handleCreateFile = () => {
		if (!dialogInput.trim()) return;
		fsCreateFile(dialogInput.trim(), currentFolderId, 'New file content');
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	};

	const handleRename = () => {
		if (!dialog.targetItem || !dialogInput.trim()) return;
		fsRenameItem(dialog.targetItem.id, dialogInput.trim());
		setDialog({ type: null });
		setDialogInput('');
		refreshItems();
	};

	const handleDelete = () => {
		if (!dialog.targetItem) return;
		fsDeleteItem(dialog.targetItem.id);
		if (selectedItemId === dialog.targetItem.id) {
			setSelectedItemId(null);
		}
		setDialog({ type: null });
		refreshItems();
	};

	return (
		<div className="finder flex flex-col w-full h-full bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 select-none">
			{/* Top macOS Toolbar */}
			<div className="toolbar h-12 bg-[#F6F6F6] dark:bg-[#282828] border-b border-gray-300/60 dark:border-black/50 flex items-center justify-between px-3 shrink-0 gap-2">
				{/* Navigation history & view toggles */}
				<div className="flex items-center gap-1.5">
					<div className="flex items-center bg-gray-200/70 dark:bg-white/10 rounded-md p-0.5">
						<button
							className="w-7 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
							onClick={goBack}
							disabled={historyIndex === 0}
							title="Back"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="15 18 9 12 15 6" />
							</svg>
						</button>
						<button
							className="w-7 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
							onClick={goForward}
							disabled={historyIndex >= history.length - 1}
							title="Forward"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</button>
					</div>

					{/* View mode toggle */}
					<div className="flex items-center bg-gray-200/70 dark:bg-white/10 rounded-md p-0.5 ml-2">
						<button
							className={`w-7 h-6 flex items-center justify-center rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-white/20 shadow-xs' : 'hover:bg-white/50'}`}
							onClick={() => setViewMode('grid')}
							title="Icons View"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
							</svg>
						</button>
						<button
							className={`w-7 h-6 flex items-center justify-center rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/20 shadow-xs' : 'hover:bg-white/50'}`}
							onClick={() => setViewMode('list')}
							title="List View"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<line x1="8" y1="6" x2="21" y2="6" />
								<line x1="8" y1="12" x2="21" y2="12" />
								<line x1="8" y1="18" x2="21" y2="18" />
								<line x1="3" y1="6" x2="3.01" y2="6" />
								<line x1="3" y1="12" x2="3.01" y2="12" />
								<line x1="3" y1="18" x2="3.01" y2="18" />
							</svg>
						</button>
					</div>
				</div>

				{/* Breadcrumb Path Bar */}
				<div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto px-2 py-1 bg-white/70 dark:bg-white/5 rounded-md border border-gray-300/40 dark:border-white/5 max-w-[280px]">
					<button
						className="hover:underline font-medium hover:text-blue-500"
						onClick={() => navigateTo(null)}
					>
						Home
					</button>
					{breadcrumbs.map(crumb => (
						<div key={crumb.id} className="flex items-center gap-1.5">
							<span className="text-gray-400">/</span>
							<button
								className="hover:underline font-medium hover:text-blue-500 truncate max-w-[80px]"
								onClick={() => navigateTo(crumb.id)}
							>
								{crumb.name}
							</button>
						</div>
					))}
				</div>

				{/* Action Buttons & Search */}
				<div className="flex items-center gap-2">
					<button
						className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-200/80 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors flex items-center gap-1"
						onClick={() => {
							setDialogInput('New Folder');
							setDialog({ type: 'createFolder' });
						}}
						title="New Folder"
					>
						<svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
							<line x1="12" y1="11" x2="12" y2="17" />
							<line x1="9" y1="14" x2="15" y2="14" />
						</svg>
						<span>Folder</span>
					</button>

					<button
						className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-200/80 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors flex items-center gap-1"
						onClick={() => {
							setDialogInput('untitled.txt');
							setDialog({ type: 'createFile' });
						}}
						title="New File"
					>
						<svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="12" y1="18" x2="12" y2="12" />
							<line x1="9" y1="15" x2="15" y2="15" />
						</svg>
						<span>File</span>
					</button>

					{selectedItem && (
						<>
							<button
								className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
								onClick={() => {
									setDialogInput(selectedItem.name);
									setDialog({ type: 'rename', targetItem: selectedItem });
								}}
								title="Rename"
							>
								<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>

							<button
								className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
								onClick={() => setDialog({ type: 'delete', targetItem: selectedItem })}
								title="Delete"
							>
								<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
								</svg>
							</button>
						</>
					)}

					{/* Search Bar */}
					<div className="relative w-36">
						<input
							type="text"
							placeholder="Search"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="w-full bg-white dark:bg-white/10 border border-gray-300/70 dark:border-white/10 rounded-md px-2.5 py-1 text-xs outline-none focus:border-blue-500"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="absolute right-1.5 top-1.5 text-gray-400 hover:text-gray-600"
							>
								×
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Main Window Body (Sidebar + Content Area) */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<div className="sidebar w-48 bg-[#F0F0F0]/80 dark:bg-[#252525]/80 backdrop-blur-md border-r border-gray-300/50 dark:border-black/50 p-2 overflow-y-auto shrink-0 flex flex-col justify-between">
					<div>
						{sidebarSections.map(section => (
							<div key={section.title} className="mb-4">
								<div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1 tracking-wider">
									{section.title}
								</div>
								<div className="space-y-0.5">
									{section.items.map(item => {
										const isActive = currentFolderId === item.folderId;
										return (
											<button
												key={item.id}
												onClick={() => navigateTo(item.folderId)}
												className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
													isActive
														? 'bg-blue-500 text-white'
														: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
												}`}
											>
												<span className={isActive ? 'text-white' : 'text-blue-500'}>
													{item.icon === 'desktop' && (
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
															<line x1="8" y1="21" x2="16" y2="21" />
															<line x1="12" y1="17" x2="12" y2="21" />
														</svg>
													)}
													{item.icon === 'file-text' && (
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
															<polyline points="14 2 14 8 20 8" />
															<line x1="16" y1="13" x2="8" y2="13" />
															<line x1="16" y1="17" x2="8" y2="17" />
														</svg>
													)}
													{item.icon === 'download' && (
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
															<polyline points="7 10 12 15 17 10" />
															<line x1="12" y1="15" x2="12" y2="3" />
														</svg>
													)}
													{item.icon === 'image' && (
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
															<circle cx="8.5" cy="8.5" r="1.5" />
															<polyline points="21 15 16 10 5 21" />
														</svg>
													)}
												</span>
												<span className="truncate">{item.name}</span>
											</button>
										);
									})}
								</div>
							</div>
						))}
					</div>

					{/* Storage status footer */}
					<div className="px-2 py-1 text-[11px] text-gray-400 border-t border-gray-300/40 dark:border-white/5">
						{allItems.length} items total
					</div>
				</div>

				{/* Content Grid / List View */}
				<div
					className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#1E1E1E]"
					onClick={() => setSelectedItemId(null)}
				>
					{currentItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-gray-400">
							<svg className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
								<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
							</svg>
							<p className="text-sm font-medium">This folder is empty</p>
						</div>
					) : viewMode === 'grid' ? (
						<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
							{currentItems.map(item => {
								const isSelected = selectedItemId === item.id;
								return (
									<div
										key={item.id}
										onClick={e => {
											e.stopPropagation();
											setSelectedItemId(item.id);
										}}
										onDoubleClick={() => {
											if (item.type === 'folder') {
												navigateTo(item.id);
											} else {
												setDialog({ type: 'preview', targetItem: item });
											}
										}}
										className={`group flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
											isSelected
												? 'bg-blue-500 text-white'
												: 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
										}`}
									>
										{item.type === 'folder' ? (
											<svg className={`w-12 h-12 mb-1.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} viewBox="0 0 24 24" fill="currentColor">
												<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
											</svg>
										) : (
											<svg className={`w-12 h-12 mb-1.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
												<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
												<polyline points="14 2 14 8 20 8" />
												<line x1="16" y1="13" x2="8" y2="13" />
												<line x1="16" y1="17" x2="8" y2="17" />
												<line x1="10" y1="9" x2="8" y2="9" />
											</svg>
										)}
										<span className="text-xs text-center break-all line-clamp-2 max-w-full font-medium">
											{item.name}
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<div className="w-full">
							<div className="grid grid-cols-12 text-[11px] font-semibold text-gray-400 border-b border-gray-200 dark:border-white/10 pb-1 mb-1 px-2">
								<span className="col-span-6">Name</span>
								<span className="col-span-3">Date Modified</span>
								<span className="col-span-3 text-right">Size</span>
							</div>
							<div className="space-y-0.5">
								{currentItems.map(item => {
									const isSelected = selectedItemId === item.id;
									return (
										<div
											key={item.id}
											onClick={e => {
												e.stopPropagation();
												setSelectedItemId(item.id);
											}}
											onDoubleClick={() => {
												if (item.type === 'folder') {
													navigateTo(item.id);
												} else {
													setDialog({ type: 'preview', targetItem: item });
												}
											}}
											className={`grid grid-cols-12 items-center px-2 py-1.5 rounded text-xs cursor-pointer ${
												isSelected
													? 'bg-blue-500 text-white'
													: 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
											}`}
										>
											<div className="col-span-6 flex items-center gap-2 truncate">
												{item.type === 'folder' ? (
													<svg className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-400'}`} viewBox="0 0 24 24" fill="currentColor">
														<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
													</svg>
												) : (
													<svg className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
														<polyline points="14 2 14 8 20 8" />
													</svg>
												)}
												<span className="truncate">{item.name}</span>
											</div>
											<span className="col-span-3 text-[11px] text-gray-400 truncate">
												{formatDate(item.modified)}
											</span>
											<span className="col-span-3 text-[11px] text-gray-400 text-right truncate">
												{item.type === 'file' && item.size !== undefined
													? formatFileSize(item.size)
													: '--'}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Status Bar */}
			<div className="h-6 bg-[#F6F6F6] dark:bg-[#282828] border-t border-gray-300/40 dark:border-black/50 px-3 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
				<span>{currentItems.length} items</span>
				{selectedItem && (
					<span>
						Selected: {selectedItem.name} {selectedItem.size ? `(${formatFileSize(selectedItem.size)})` : ''}
					</span>
				)}
			</div>

			{/* macOS Dialog Modals */}
			{dialog.type && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
					<div className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-2xl border border-black/10 dark:border-white/10 w-80 p-5 text-gray-800 dark:text-gray-200">
						{dialog.type === 'createFolder' && (
							<>
								<h3 className="font-semibold text-sm mb-3">New Folder</h3>
								<input
									type="text"
									autoFocus
									value={dialogInput}
									onChange={e => setDialogInput(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
									className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
								/>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setDialog({ type: null })}
										className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
									>
										Cancel
									</button>
									<button
										onClick={handleCreateFolder}
										className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
									>
										Create
									</button>
								</div>
							</>
						)}

						{dialog.type === 'createFile' && (
							<>
								<h3 className="font-semibold text-sm mb-3">New File</h3>
								<input
									type="text"
									autoFocus
									value={dialogInput}
									onChange={e => setDialogInput(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleCreateFile()}
									className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
								/>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setDialog({ type: null })}
										className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
									>
										Cancel
									</button>
									<button
										onClick={handleCreateFile}
										className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
									>
										Create
									</button>
								</div>
							</>
						)}

						{dialog.type === 'rename' && (
							<>
								<h3 className="font-semibold text-sm mb-3">Rename Item</h3>
								<input
									type="text"
									autoFocus
									value={dialogInput}
									onChange={e => setDialogInput(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleRename()}
									className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
								/>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setDialog({ type: null })}
										className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
									>
										Cancel
									</button>
									<button
										onClick={handleRename}
										className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
									>
										Rename
									</button>
								</div>
							</>
						)}

						{dialog.type === 'delete' && (
							<>
								<h3 className="font-semibold text-sm mb-2 text-red-500">Delete Item?</h3>
								<p className="text-xs text-gray-500 mb-4">
									Are you sure you want to delete &quot;{dialog.targetItem?.name}&quot;?
								</p>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => setDialog({ type: null })}
										className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
									>
										Cancel
									</button>
									<button
										onClick={handleDelete}
										className="px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 font-medium"
									>
										Delete
									</button>
								</div>
							</>
						)}

						{dialog.type === 'preview' && dialog.targetItem && (
							<>
								<div className="flex justify-between items-center mb-3">
									<h3 className="font-semibold text-sm truncate">{dialog.targetItem.name}</h3>
									<button
										onClick={() => setDialog({ type: null })}
										className="text-gray-400 hover:text-gray-600"
									>
										×
									</button>
								</div>
								<div className="bg-gray-50 dark:bg-black/40 rounded-md p-3 text-xs font-mono max-h-48 overflow-y-auto mb-3 whitespace-pre-wrap">
									{dialog.targetItem.content || '(Empty file)'}
								</div>
								<div className="flex justify-between items-center text-[11px] text-gray-400">
									<span>Size: {formatFileSize(dialog.targetItem.size || 0)}</span>
									<button
										onClick={() => setDialog({ type: null })}
										className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white"
									>
										Done
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}


