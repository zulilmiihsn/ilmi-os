'use client';

import type { Note } from '../types';
import FormatToolbar from './FormatToolbar';

interface NoteDetailProps {
	currentNote: Note | null;
	showFormatToolbar: boolean;
	setShowFormatToolbar: (show: boolean) => void;
	handleBack: () => void;
	updateCurrentNote: (updates: Partial<Note>) => void;
}

export default function NoteDetail({
	currentNote,
	showFormatToolbar,
	setShowFormatToolbar,
	handleBack,
	updateCurrentNote,
}: NoteDetailProps) {
	return (
		<div className="flex flex-col h-full animate-in slide-in-from-right duration-300 relative bg-white dark:bg-black transition-colors">
			{/* Detail Header */}
			<div className="flex items-center justify-between px-4 pt-6 pb-3 border-b border-gray-200 dark:border-white/10 sticky top-0 backdrop-blur-md z-10 bg-white/90 dark:bg-black/90">
				<button
					onClick={handleBack}
					className="flex items-center text-[#DCA326] font-medium text-sm active:opacity-50 transition-opacity"
				>
					<svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
					</svg>
					Notes
				</button>
				<div className="flex items-center gap-4">
					<button
						onClick={() => setShowFormatToolbar(!showFormatToolbar)}
						className={`text-[#DCA326] active:opacity-50 transition-opacity p-1 rounded ${
							showFormatToolbar ? 'bg-[#DCA326]/10' : ''
						}`}
						title="Format Text"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
						</svg>
					</button>
					<button
						onClick={handleBack}
						className="text-[#DCA326] text-sm font-semibold active:opacity-50 transition-opacity"
					>
						Done
					</button>
				</div>
			</div>

			{/* Detail Content */}
			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col">
				<div className="mb-4">
					<span className="text-gray-400 text-xs font-medium block text-center mb-3">
						{currentNote?.date
							? `${new Date(currentNote.date).toLocaleDateString([], {
									month: 'long',
									day: 'numeric',
								})} at ${new Date(currentNote.date).toLocaleTimeString([], {
									hour: 'numeric',
									minute: '2-digit',
								})}`
							: ''}
					</span>
					<input
						type="text"
						value={currentNote?.title || ''}
						onChange={e => updateCurrentNote({ title: e.target.value })}
						placeholder="Title"
						className="text-xl font-bold mb-2 w-full border-none outline-none placeholder-gray-400 bg-transparent text-black dark:text-white"
					/>
				</div>
				<textarea
					value={currentNote?.content || ''}
					onChange={e => updateCurrentNote({ content: e.target.value })}
					placeholder="Type something..."
					className="w-full flex-1 resize-none border-none outline-none text-sm leading-relaxed bg-transparent placeholder-gray-400 text-gray-800 dark:text-gray-200"
				/>
			</div>

			{/* Formatting Toolbar */}
			{showFormatToolbar && <FormatToolbar onClose={() => setShowFormatToolbar(false)} />}
		</div>
	);
}
