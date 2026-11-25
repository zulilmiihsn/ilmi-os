'use client';

import { TIMING } from '../../../constants';
import { formatFileSize } from '../../../utils/fileSystem';
import type { FileItem } from './types';

interface FilesContentProps {
	activeTab: 'recents' | 'shared' | 'browse';
	enrichedItems: FileItem[];
	isAnimating: boolean;
	navigationDirection: 'forward' | 'back' | null;
	longPressTimer: ReturnType<typeof setTimeout> | null;
	onSetLongPressTimer: (timer: ReturnType<typeof setTimeout> | null) => void;
	onItemClick: (item: FileItem) => void;
	onLongPress: (item: FileItem) => void;
	onCreateFolderClick: () => void;
	theme: {
		text: string;
		textSecondary: string;
		textMuted: string;
		itemBg: string;
		itemIconFolder: string;
		itemIconFile: string;
	};
}

export default function FilesContent({
	activeTab,
	enrichedItems,
	isAnimating,
	navigationDirection,
	longPressTimer,
	onSetLongPressTimer,
	onItemClick,
	onLongPress,
	onCreateFolderClick,
	theme,
}: FilesContentProps) {
	return (
		<div className="flex-1 relative overflow-hidden">
			{/* Scrollable Content Container */}
			<div
				className={`absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden pb-24 transition-opacity duration-150 ${
					isAnimating
						? navigationDirection === 'forward'
							? 'opacity-70 translate-x-1'
							: 'opacity-70 -translate-x-1'
						: 'opacity-100 translate-x-0'
				}`}
			>
				{/* Empty States */}
				{activeTab === 'shared' && enrichedItems.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
						<svg
							aria-hidden="true"
							className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
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
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
						<svg
							aria-hidden="true"
							className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
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
						<p className="text-sm">Files you&apos;ve opened recently will appear here.</p>
					</div>
				)}

				{activeTab === 'browse' && enrichedItems.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
						<svg
							aria-hidden="true"
							className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
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
							type="button"
							onClick={onCreateFolderClick}
							className="mt-4 px-4 py-2 bg-ios-blue text-white rounded-lg font-medium active:opacity-80 transition-opacity"
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
								className="flex flex-col items-center group cursor-pointer"
								role="button"
								tabIndex={0}
								aria-label={item.name}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onItemClick(item);
									}
								}}
								onClick={() => onItemClick(item)}
								onContextMenu={e => {
									e.preventDefault();
									onLongPress(item);
								}}
								onTouchStart={() => {
									const timer = setTimeout(() => onLongPress(item), TIMING.LONG_PRESS_FILES);
									onSetLongPressTimer(timer);
								}}
								onTouchMove={() => {
									if (longPressTimer) {
										clearTimeout(longPressTimer);
										onSetLongPressTimer(null);
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
											aria-hidden="true"
											className={`w-10 h-10 ${theme.itemIconFolder}`}
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
										</svg>
									) : (
										<svg
											aria-hidden="true"
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
	);
}
