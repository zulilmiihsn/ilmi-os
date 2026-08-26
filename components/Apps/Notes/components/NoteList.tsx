'use client';

import type { Note } from '../types';
import NoteItem from './NoteItem';
import { triggerHaptic } from '../../../../utils/haptic';

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
		<div className="flex flex-col h-full select-none bg-[#f2f2f7] dark:bg-black text-black dark:text-white">
			{/* Sticky Header */}
			<div className="px-4 pt-10 pb-2 shrink-0 bg-[#f2f2f7] dark:bg-black">
				<div className="flex justify-between items-center mb-2">
					<div className="w-12"></div>
					<button
						onClick={() => {
							triggerHaptic('light');
							toggleSelectionMode();
						}}
						className="text-[#e3a824] font-normal text-base active:opacity-50 transition-opacity"
					>
						{selectionMode ? 'Done' : 'Select'}
					</button>
				</div>

				{/* Large Title */}
				<h1 className="text-3xl font-bold tracking-tight mb-3">
					{selectionMode ? `${selectedCount} Selected` : 'Notes'}
				</h1>

				{/* Search Bar Capsule */}
				<div className="relative mb-2">
					<div className="flex items-center rounded-xl px-3 py-2 border bg-[#e3e3e8]/70 dark:bg-[#1c1c1e] border-black/5 dark:border-white/10">
						<svg className="h-4 w-4 text-gray-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							type="text"
							className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
							placeholder="Search"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="text-gray-400 text-xs"
							>
								<i className="fas fa-times-circle"></i>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Note List Items */}
			<div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
				{notes.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 text-gray-400">
						<svg className="w-14 h-14 mb-3 text-gray-300 dark:text-gray-700 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						<p className="text-sm font-medium">No Notes</p>
					</div>
				) : (
					<>
						{todayNotes.length > 0 && (
							<div>
								<h2 className="text-xs font-semibold text-gray-400 uppercase mb-1.5 ml-2 tracking-wider">Today</h2>
								<div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-xs border border-black/5 dark:border-white/10 transition-colors">
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
							<div>
								<h2 className="text-xs font-semibold text-gray-400 uppercase mb-1.5 ml-2 tracking-wider">Previous</h2>
								<div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-xs border border-black/5 dark:border-white/10 transition-colors">
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

			{/* Floating Liquid Glass Toolbar */}
			<div className="shrink-0 p-4 pb-8 flex items-center justify-center">
				<div className="w-full max-w-[340px] px-5 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 transition-all">
					{selectionMode ? (
						<>
							<span className="text-xs text-gray-400">Batch select</span>
							<button
								className={`text-sm font-medium transition-opacity ${
									selectedCount > 0 ? 'text-red-500 active:scale-95' : 'text-red-300 pointer-events-none'
								}`}
								onClick={() => {
									triggerHaptic('medium');
									deleteSelectedNotes();
								}}
								disabled={selectedCount === 0}
							>
								Delete ({selectedCount})
							</button>
						</>
					) : (
						<>
							<div className="w-8" />
							<div className="text-xs text-gray-400 font-medium">{notes.length} Notes</div>
							<button
								type="button"
								onClick={() => {
									triggerHaptic('light');
									createNewNote();
								}}
								className="text-[#e3a824] p-1 active:scale-95 transition-transform"
								aria-label="New Note"
							>
								<i className="far fa-edit text-lg"></i>
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
