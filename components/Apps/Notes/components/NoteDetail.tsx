'use client';

import { useRef } from 'react';
import type { Note } from '../types';
import FormatToolbar, { type FormatAction } from './FormatToolbar';
import { ChevronLeft } from 'lucide-react';
import { triggerHaptic } from '../../../../utils/haptic';

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
	const bodyRef = useRef<HTMLTextAreaElement | null>(null);

	// Plain-text markdown formatting on the current selection (or cursor).
	// Colors have no plain-text equivalent, so the toolbar omits them.
	const applyFormat = (action: FormatAction) => {
		const text = currentNote?.content ?? '';
		const el = bodyRef.current;
		const start = el?.selectionStart ?? text.length;
		const end = el?.selectionEnd ?? text.length;
		let next = text;
		let anchor = start;
		let focus = end;

		const wrap = (before: string, after: string) => {
			if (start === end) {
				next = text.slice(0, start) + before + after + text.slice(end);
				anchor = focus = start + before.length;
			} else {
				const sel = text.slice(start, end);
				next = text.slice(0, start) + before + sel + after + text.slice(end);
				anchor = start + before.length;
				focus = anchor + sel.length;
			}
		};
		const prefixLine = (prefix: string) => {
			const lineStart = text.lastIndexOf('\n', start - 1) + 1;
			const rawEnd = text.indexOf('\n', start);
			const lineEnd = rawEnd === -1 ? text.length : rawEnd;
			const stripped = text.slice(lineStart, lineEnd).replace(/^#{1,3}\s+/, '');
			const newLine = prefix ? `${prefix}${stripped}` : stripped;
			next = text.slice(0, lineStart) + newLine + text.slice(lineEnd);
			anchor = focus = lineStart + newLine.length;
		};

		switch (action) {
			case 'bold':
				wrap('**', '**');
				break;
			case 'italic':
				wrap('*', '*');
				break;
			case 'underline':
				wrap('__', '__');
				break;
			case 'strike':
				wrap('~~', '~~');
				break;
			case 'title':
				prefixLine('# ');
				break;
			case 'heading':
				prefixLine('## ');
				break;
			case 'subheading':
				prefixLine('### ');
				break;
			case 'body':
				prefixLine('');
				break;
		}
		updateCurrentNote({ content: next });
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(anchor, focus);
		});
	};

	return (
		<div className="flex flex-col h-full animate-in slide-in-from-right duration-250 relative bg-white dark:bg-black text-black dark:text-white transition-colors">
			{/* Detail Header */}
			<div className="flex items-center justify-between px-4 pt-10 pb-2 border-b border-gray-100 dark:border-white/10 sticky top-0 backdrop-blur-xl z-10 bg-white/90 dark:bg-black/90">
				<button
					onClick={() => {
						triggerHaptic('light');
						handleBack();
					}}
					className="relative flex items-center text-ios-yellow font-normal text-base active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={18} className="mr-1.5" />
					<span>Notes</span>
				</button>
				<div className="flex items-center gap-4">
					<button
						onClick={() => {
							triggerHaptic('light');
							setShowFormatToolbar(!showFormatToolbar);
						}}
						className={`relative text-ios-yellow active:scale-95 transition-transform p-1.5 rounded-full after:absolute after:-inset-1.5 after:content-[''] ${
							showFormatToolbar ? 'bg-ios-yellow/15' : ''
						}`}
						title="Format Text"
						aria-label="Format text"
						aria-expanded={showFormatToolbar}
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
						</svg>
					</button>
					<button
						onClick={() => {
							triggerHaptic('light');
							handleBack();
						}}
						className="relative text-ios-yellow text-base font-semibold active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
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
						aria-label="Note title"
						className="text-ios-title1 mb-2 w-full border-none outline-none placeholder-gray-400 bg-transparent text-black dark:text-white"
					/>
				</div>
				<textarea
					ref={bodyRef}
					value={currentNote?.content || ''}
					onChange={e => updateCurrentNote({ content: e.target.value })}
					placeholder="Type something..."
					className="w-full flex-1 resize-none border-none outline-none text-[15px] leading-relaxed bg-transparent placeholder-gray-400 text-gray-800 dark:text-gray-200"
				/>
			</div>

			{/* Formatting Toolbar Floating Glass Capsule */}
			{showFormatToolbar && (
				<FormatToolbar onClose={() => setShowFormatToolbar(false)} onFormat={applyFormat} />
			)}
		</div>
	);
}
