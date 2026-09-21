'use client';

import React from 'react';
import { useFinder } from './Finder/useFinder';
import { FinderToolbar } from './Finder/FinderToolbar';
import { FinderSidebar } from './Finder/FinderSidebar';
import { FinderContent } from './Finder/FinderContent';
import { FinderModals } from './Finder/FinderModals';

export default function Finder() {
	const {
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
	} = useFinder();

	return (
		<div className="finder flex flex-col w-full h-full bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 select-none">
			<FinderToolbar
				goBack={goBack}
				goForward={goForward}
				historyIndex={historyIndex}
				historyLength={history.length}
				viewMode={viewMode}
				setViewMode={setViewMode}
				breadcrumbs={breadcrumbs}
				navigateTo={navigateTo}
				selectedItem={selectedItem}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				setDialog={setDialog}
				setDialogInput={setDialogInput}
			/>

			<div className="flex flex-1 overflow-hidden">
				<FinderSidebar
					sidebarSections={sidebarSections}
					currentFolderId={currentFolderId}
					navigateTo={navigateTo}
					totalItemsCount={allItems.length}
				/>

				<FinderContent
					currentItems={currentItems}
					viewMode={viewMode}
					selectedItemId={selectedItemId}
					setSelectedItemId={setSelectedItemId}
					navigateTo={navigateTo}
					setDialog={setDialog}
					selectedItem={selectedItem}
				/>
			</div>

			<FinderModals
				dialog={dialog}
				dialogInput={dialogInput}
				setDialogInput={setDialogInput}
				setDialog={setDialog}
				dialogError={dialogError}
				handleCreateFolder={handleCreateFolder}
				handleCreateFile={handleCreateFile}
				handleRename={handleRename}
				handleDelete={handleDelete}
			/>
		</div>
	);
}
