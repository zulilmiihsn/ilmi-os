'use client';

import { useNotes } from './hooks/useNotes';
import NoteList from './components/NoteList';
import NoteDetail from './components/NoteDetail';
import DeleteAlert from './components/DeleteAlert';

export default function Notes() {
	const {
		mounted,
		saveFailed,
		notes,
		view,
		currentNote,
		searchQuery,
		setSearchQuery,
		selectionMode,
		showFormatToolbar,
		setShowFormatToolbar,
		showDeleteAlert,
		setShowDeleteAlert,
		selectedCount,
		todayNotes,
		previousNotes,
		handleNoteClick,
		handleBack,
		createNewNote,
		updateCurrentNote,
		toggleSelectionMode,
		confirmDelete,
	} = useNotes();

	if (!mounted) return null;

	return (
		<div className="notes-app relative w-full h-full flex flex-col overflow-hidden font-sans transition-colors duration-300 bg-[#f2f2f7] dark:bg-black text-black dark:text-white">
			{saveFailed && (
				<div
					role="alert"
					className="mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 shrink-0"
				>
					Could not save notes. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			<div className="flex-1 flex min-h-0 overflow-hidden">
				{/* List Pane: full width on mobile when view === 'list', persistent sidebar on md+ */}
				<div
					className={`${
						view === 'list' ? 'flex' : 'hidden md:flex'
					} flex-col w-full md:w-72 lg:w-80 md:border-r md:border-black/10 dark:md:border-white/10 shrink-0 h-full overflow-hidden`}
				>
					<NoteList
						notes={notes}
						todayNotes={todayNotes}
						previousNotes={previousNotes}
						activeNoteId={currentNote?.id ?? null}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						selectionMode={selectionMode}
						toggleSelectionMode={toggleSelectionMode}
						selectedCount={selectedCount}
						handleNoteClick={handleNoteClick}
						createNewNote={createNewNote}
						deleteSelectedNotes={() => selectedCount > 0 && setShowDeleteAlert(true)}
					/>
				</div>

				{/* Detail Pane: full width on mobile when view === 'detail', side-by-side on md+ */}
				<div
					className={`${
						view === 'detail' ? 'flex' : 'hidden md:flex'
					} flex-col flex-1 min-w-0 h-full overflow-hidden`}
				>
					<NoteDetail
						currentNote={currentNote}
						showFormatToolbar={showFormatToolbar}
						setShowFormatToolbar={setShowFormatToolbar}
						handleBack={handleBack}
						updateCurrentNote={updateCurrentNote}
						onCreateNote={createNewNote}
					/>
				</div>
			</div>

			{showDeleteAlert && (
				<DeleteAlert
					count={selectedCount}
					onCancel={() => setShowDeleteAlert(false)}
					onDelete={confirmDelete}
				/>
			)}
		</div>
	);
}
