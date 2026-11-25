'use client';

import { useSettingsStore } from '../../../stores/settings';
import {
	CreateFolderDialog,
	RenameDialog,
	DeleteConfirmDialog,
	ActionMenu,
	ActionSheet,
	FilePreviewModal,
} from './Modals';
import TabBar from './TabBar';
import FilesHeader from './FilesHeader';
import FilesContent from './FilesContent';
import { SORT_LABELS, useFilesState } from './useFilesState';

export default function Files() {
	const { darkMode } = useSettingsStore();
	const state = useFilesState();

	const currentPathName = state.folderPath[state.folderPath.length - 1]?.name ?? '';

	if (!state.mounted) return null;

	const theme = {
		bg: darkMode ? 'bg-black' : 'bg-ios-gray6',
		text: darkMode ? 'text-white' : 'text-black',
		textSecondary: darkMode ? 'text-ios-gray' : 'text-gray-700',
		textMuted: 'text-ios-gray',
		headerBg: darkMode ? 'bg-black border-ios-dark-separator' : 'bg-white border-ios-separator',
		searchBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-ios-gray5',
		searchPlaceholder: 'placeholder-gray-500',
		itemBg: darkMode ? 'bg-ios-dark-gray6' : 'bg-white',
		itemIconFolder: 'text-ios-blue',
		itemIconFile: 'text-ios-gray',
		activeTab: 'text-ios-blue',
	};

	return (
		<div
			className={`files-app relative w-full h-full flex flex-col overflow-hidden font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}
		>
			{state.persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					{state.persistError}
				</div>
			)}

			<FilesHeader
				activeTab={state.activeTab}
				canGoBack={state.activeTab === 'browse' && state.folderPath.length > 1}
				currentPathName={currentPathName}
				searchQuery={state.searchQuery}
				onSearchChange={state.setSearchQuery}
				onBack={state.handleBack}
				onOpenActionMenu={() => state.setShowActionMenu(true)}
				theme={theme}
			/>

			<FilesContent
				activeTab={state.activeTab}
				enrichedItems={state.enrichedItems}
				isAnimating={state.isAnimating}
				navigationDirection={state.navigationDirection}
				longPressTimer={state.longPressTimer}
				onSetLongPressTimer={state.setLongPressTimer}
				onItemClick={state.handleItemClick}
				onLongPress={state.handleLongPress}
				onCreateFolderClick={() => state.setShowCreateDialog(true)}
				theme={theme}
			/>

			<TabBar activeTab={state.activeTab} onTabChange={state.handleTabChange} darkMode={darkMode} />

			<FilePreviewModal
				item={state.previewItem}
				onClose={() => state.setPreviewItem(null)}
				darkMode={darkMode}
			/>

			<CreateFolderDialog
				isOpen={state.showCreateDialog}
				onClose={() => state.setShowCreateDialog(false)}
				onCreate={state.handleCreateFolder}
				folderName={state.newFolderName}
				onFolderNameChange={state.setNewFolderName}
				darkMode={darkMode}
			/>

			<input
				ref={state.fileInputRef}
				type="file"
				multiple
				className="hidden"
				tabIndex={-1}
				aria-hidden="true"
				onChange={e => {
					void state.handleUploadFiles(e.target.files);
					e.target.value = '';
				}}
			/>

			<ActionMenu
				isOpen={state.showActionMenu}
				onClose={() => state.setShowActionMenu(false)}
				onNewFolder={() => {
					state.setShowActionMenu(false);
					state.setShowCreateDialog(true);
				}}
				onUpload={() => {
					state.setShowActionMenu(false);
					state.fileInputRef.current?.click();
				}}
				onCycleSort={() => {
					state.cycleSortMode();
					state.setShowActionMenu(false);
				}}
				sortLabel={SORT_LABELS[state.sortMode]}
				darkMode={darkMode}
			/>

			<ActionSheet
				isOpen={state.showActionSheet}
				onClose={() => state.setShowActionSheet(false)}
				itemName={state.selectedItemName}
				onRename={() => {
					state.setShowRenameDialog(true);
					state.setRenameValue(state.selectedItemName);
					state.setShowActionSheet(false);
				}}
				onDelete={() => {
					state.setShowDeleteConfirm(true);
					state.setShowActionSheet(false);
				}}
				darkMode={darkMode}
			/>

			<DeleteConfirmDialog
				isOpen={state.showDeleteConfirm}
				onClose={() => state.setShowDeleteConfirm(false)}
				onConfirm={state.handleDelete}
				darkMode={darkMode}
			/>

			<RenameDialog
				isOpen={state.showRenameDialog}
				onClose={() => state.setShowRenameDialog(false)}
				onRename={state.handleRename}
				value={state.renameValue}
				onValueChange={state.setRenameValue}
				darkMode={darkMode}
			/>
		</div>
	);
}
