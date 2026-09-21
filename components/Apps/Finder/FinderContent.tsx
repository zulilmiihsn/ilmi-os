'use client';

import React from 'react';
import { FileItem, formatDate, formatFileSize } from '../../../utils/fileSystem';
import { DialogState } from './types';

interface FinderContentProps {
	currentItems: FileItem[];
	viewMode: 'grid' | 'list';
	selectedItemId: string | null;
	setSelectedItemId: (id: string | null) => void;
	navigateTo: (folderId: string | null) => void;
	setDialog: (dialog: DialogState) => void;
	selectedItem?: FileItem;
}

export const FinderContent: React.FC<FinderContentProps> = ({
	currentItems,
	viewMode,
	selectedItemId,
	setSelectedItemId,
	navigateTo,
	setDialog,
	selectedItem,
}) => {
	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			{/* Content Area */}
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

			{/* Status Bar */}
			<div className="h-6 bg-[#F6F6F6] dark:bg-[#282828] border-t border-gray-300/40 dark:border-black/50 px-3 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
				<span>{currentItems.length} items</span>
				{selectedItem && (
					<span>
						Selected: {selectedItem.name} {selectedItem.size ? `(${formatFileSize(selectedItem.size)})` : ''}
					</span>
				)}
			</div>
		</div>
	);
};
