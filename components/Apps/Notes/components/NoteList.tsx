'use client';

import type { Note } from '../types';
import NoteItem from './NoteItem';

interface NoteListProps {
	notes: Note[];
	todayNotes: Note[];
	previousNotes: Note[];
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	selectionMode: boolean;
	toggleSelectionMode: () => void;
	selectedCount: number;
	handleNoteClick: (note: Note) => void;
	createNewNote: () => void;
	deleteSelectedNotes: () => void;
}

export default function NoteList({
	notes,
	todayNotes,
	previousNotes,
	searchQuery,
	setSearchQuery,
	selectionMode,
	toggleSelectionMode,
	selectedCount,
	handleNoteClick,
	createNewNote,
	deleteSelectedNotes,
}: NoteListProps) {
	return (
		<div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
			{/* Sticky Header */}
			<div className="px-4 pt-6 pb-2 sticky top-0 z-10 bg-gray-100/90 dark:bg-black/90 backdrop-blur-md transition-colors">
				<div className="flex justify-between items-end mb-3">
					<h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
						{selectionMode ? `${selectedCount} Selected` : 'Notes'}
					</h1>
					<button
						onClick={toggleSelectionMode}
						className="text-[#DCA326] font-semibold text-sm active:opacity-50 transition-opacity"
					>
						{selectionMode ? 'Done' : 'Select'}
					</button>
				</div>

				{/* Search Bar */}
				<div className="relative mb-2">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						className="block w-full pl-9 pr-8 py-2 border-none rounded-xl leading-5 focus:outline-none transition-colors text-sm bg-gray-200/80 dark:bg-white/10 text-black dark:text-white placeholder-gray-400"
						placeholder="Search"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery('')}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							<svg className="h-4 w-4 bg-gray-300 dark:bg-gray-600 text-white rounded-full p-0.5" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
							</svg>
						</button>
					)}
				</div>
			</div>

			{/* Note List Items */}
			<div className="flex-1 overflow-y-auto px-4 pb-20">
				{notes.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 text-gray-400">
						<svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						<p className="text-sm font-medium">No Notes</p>
					</div>
				) : (
					<>
						{todayNotes.length > 0 && (
							<div className="mb-6">
								<h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Today</h2>
								<div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-xs border border-black/5 dark:border-white/5 transition-colors">
									{todayNotes.map((note, index) => (
										<NoteItem
											key={note.id}
											note={note}
											onClick={handleNoteClick}
											selectionMode={selectionMode}
											isLast={index === todayNotes.length - 1}
										/>
									))}
								</div>
							</div>
						)}

						{previousNotes.length > 0 && (
							<div className="mb-6">
								<h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Previous</h2>
								<div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-xs border border-black/5 dark:border-white/5 transition-colors">
									{previousNotes.map((note, index) => (
										<NoteItem
											key={note.id}
											note={note}
											onClick={handleNoteClick}
											selectionMode={selectionMode}
											isLast={index === previousNotes.length - 1}
										/>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Bottom Toolbar */}
			<div className="border-t border-gray-200 dark:border-white/10 pb-safe z-10 sticky bottom-0 bg-gray-100/90 dark:bg-black/90 backdrop-blur-md">
				<div className="flex justify-between items-center h-11 px-4">
					{selectionMode ? (
						<>
							<span className="text-xs text-gray-400">Batch select</span>
							<button
								className={`text-sm font-medium transition-opacity ${
									selectedCount > 0 ? 'text-red-500' : 'text-red-300 pointer-events-none'
								}`}
								onClick={deleteSelectedNotes}
								disabled={selectedCount === 0}
							>
								Delete ({selectedCount})
							</button>
						</>
					) : (
						<>
							<div className="w-10" />
							<div className="text-xs text-gray-400 font-medium">{notes.length} Notes</div>
							<button
								type="button"
								onClick={createNewNote}
								className="w-9 h-9 flex items-center justify-center text-[#DCA326] hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
								aria-label="New Note"
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
