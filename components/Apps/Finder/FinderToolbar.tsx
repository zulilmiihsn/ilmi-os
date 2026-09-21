'use client';

import React from 'react';
import { FileItem } from '../../../utils/fileSystem';
import { DialogState } from './types';

interface FinderToolbarProps {
	goBack: () => void;
	goForward: () => void;
	historyIndex: number;
	historyLength: number;
	viewMode: 'grid' | 'list';
	setViewMode: (mode: 'grid' | 'list') => void;
	breadcrumbs: { id: string | null; name: string }[];
	navigateTo: (folderId: string | null) => void;
	selectedItem?: FileItem;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	setDialog: (state: DialogState) => void;
	setDialogInput: (input: string) => void;
}

export const FinderToolbar: React.FC<FinderToolbarProps> = ({
	goBack,
	goForward,
	historyIndex,
	historyLength,
	viewMode,
	setViewMode,
	breadcrumbs,
	navigateTo,
	selectedItem,
	searchQuery,
	setSearchQuery,
	setDialog,
	setDialogInput,
}) => {
	return (
		<div className="toolbar h-12 bg-[#F6F6F6] dark:bg-[#282828] border-b border-gray-300/60 dark:border-black/50 flex items-center justify-between px-3 shrink-0 gap-2">
			{/* Navigation history & view toggles */}
			<div className="flex items-center gap-1.5">
				<div className="flex items-center bg-gray-200/70 dark:bg-white/10 rounded-md p-0.5">
					<button
						className="w-7 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
						onClick={goBack}
						disabled={historyIndex === 0}
						title="Back"
						aria-label="Back"
					>
						<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="15 18 9 12 15 6" />
						</svg>
					</button>
					<button
						className="w-7 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-white/20 disabled:opacity-30 transition-colors"
						onClick={goForward}
						disabled={historyIndex >= historyLength - 1}
						title="Forward"
						aria-label="Forward"
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
						aria-label="Icons View"
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
						aria-label="List View"
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
					<div key={crumb.id ?? 'root'} className="flex items-center gap-1.5">
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
					aria-label="New Folder"
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
					aria-label="New File"
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
							aria-label="Rename"
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
							aria-label="Delete"
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
							aria-label="Clear search"
						>
							×
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
