'use client';

import { useNotes } from './hooks/useNotes';
import NoteList from './components/NoteList';
import NoteDetail from './components/NoteDetail';
import DeleteAlert from './components/DeleteAlert';

export default function Notes() {
	const {
		mounted,
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
		<div className="notes-app w-full h-full overflow-hidden font-sans transition-colors duration-300 bg-gray-100 dark:bg-black text-black dark:text-white">
			{view === 'list' ? (
				<NoteList
					notes={notes}
					todayNotes={todayNotes}
					previousNotes={previousNotes}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					selectionMode={selectionMode}
					toggleSelectionMode={toggleSelectionMode}
					selectedCount={selectedCount}
					handleNoteClick={handleNoteClick}
					createNewNote={createNewNote}
					deleteSelectedNotes={() => selectedCount > 0 && setShowDeleteAlert(true)}
				/>
			) : (
				<NoteDetail
					currentNote={currentNote}
					showFormatToolbar={showFormatToolbar}
					setShowFormatToolbar={setShowFormatToolbar}
					handleBack={handleBack}
					updateCurrentNote={updateCurrentNote}
				/>
			)}

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
