'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Note } from '../types';
import FormatToolbar, {
	type BlockStyle,
	type FormatAction,
	type InlineStyle,
} from './FormatToolbar';
import { ChevronLeft, SquarePen } from 'lucide-react';
import { triggerHaptic } from '../../../../utils/haptic';

interface NoteDetailProps {
	currentNote: Note | null;
	showFormatToolbar: boolean;
	setShowFormatToolbar: (show: boolean) => void;
	handleBack: () => void;
	updateCurrentNote: (updates: Partial<Note>) => void;
	onCreateNote?: () => void;
}

function detectBlockStyle(text: string, cursorPos: number): BlockStyle {
	const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
	const rawEnd = text.indexOf('\n', cursorPos);
	const lineEnd = rawEnd === -1 ? text.length : rawEnd;
	const line = text.slice(lineStart, lineEnd);
	if (line.startsWith('### ')) return 'subheading';
	if (line.startsWith('## ')) return 'heading';
	if (line.startsWith('# ')) return 'title';
	return 'body';
}

export default function NoteDetail({
	currentNote,
	showFormatToolbar,
	setShowFormatToolbar,
	handleBack,
	updateCurrentNote,
	onCreateNote,
}: NoteDetailProps) {
	const bodyRef = useRef<HTMLTextAreaElement | null>(null);
	const [activeStyle, setActiveStyle] = useState<BlockStyle>('body');
	const [activeInline, setActiveInline] = useState<InlineStyle | null>(null);

	useEffect(() => {
		setActiveStyle('body');
		setActiveInline(null);
	}, [currentNote?.id]);

	const syncStyleFromCursor = useCallback(() => {
		const el = bodyRef.current;
		if (!el) return;
		setActiveStyle(detectBlockStyle(el.value, el.selectionStart));
	}, []);

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
				setActiveInline(prev => (prev === 'bold' ? null : 'bold'));
				break;
			case 'italic':
				wrap('*', '*');
				setActiveInline(prev => (prev === 'italic' ? null : 'italic'));
				break;
			case 'underline':
				wrap('__', '__');
				setActiveInline(prev => (prev === 'underline' ? null : 'underline'));
				break;
			case 'strike':
				wrap('~~', '~~');
				setActiveInline(prev => (prev === 'strike' ? null : 'strike'));
				break;
			case 'title':
				prefixLine('# ');
				setActiveStyle('title');
				break;
			case 'heading':
				prefixLine('## ');
				setActiveStyle('heading');
				break;
			case 'subheading':
				prefixLine('### ');
				setActiveStyle('subheading');
				break;
			case 'body':
				prefixLine('');
				setActiveStyle('body');
				break;
		}
		updateCurrentNote({ content: next });
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(anchor, focus);
		});
	};

	if (!currentNote) {
		return (
			<div className="flex flex-col items-center justify-center h-full bg-white dark:bg-black text-gray-500 dark:text-gray-400 px-6 text-center select-none">
				<p className="text-sm font-medium mb-3">Select a note to view or edit</p>
				{onCreateNote && (
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							onCreateNote();
						}}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c98a00] dark:bg-ios-yellow text-white dark:text-black text-xs font-semibold active:scale-95 transition-transform"
					>
						<SquarePen aria-hidden="true" size={14} />
						<span>New Note</span>
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full relative bg-white dark:bg-black text-black dark:text-white transition-colors">
			{/* Detail Header */}
			<div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-white/10 sticky top-0 backdrop-blur-xl z-10 bg-white/90 dark:bg-black/90">
				<button
					type="button"
					onClick={() => {
						triggerHaptic('light');
						handleBack();
					}}
					className="md:hidden relative flex items-center text-[#c98a00] dark:text-ios-yellow font-normal text-base active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={18} className="mr-1.5" />
					<span>Notes</span>
				</button>
				<div className="hidden md:block text-xs text-gray-500 dark:text-gray-400 font-medium">
					{currentNote.folder}
				</div>
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setShowFormatToolbar(!showFormatToolbar);
						}}
						className={`relative text-[#c98a00] dark:text-ios-yellow active:scale-95 transition-transform p-1.5 rounded-full after:absolute after:-inset-1.5 after:content-[''] ${
							showFormatToolbar ? 'bg-[#c98a00]/15 dark:bg-ios-yellow/15' : ''
						}`}
						title="Format Text"
						aria-label="Format text"
						aria-expanded={showFormatToolbar}
					>
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h7"
							/>
						</svg>
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							handleBack();
						}}
						className="md:hidden relative text-[#c98a00] dark:text-ios-yellow text-base font-semibold active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
					>
						Done
					</button>
				</div>
			</div>

			{/* Detail Content */}
			<div
				className={`flex-1 overflow-y-auto px-5 py-4 flex flex-col ${
					showFormatToolbar ? 'pb-40' : 'pb-6'
				}`}
			>
				<div className="mb-4">
					<span className="text-gray-500 dark:text-gray-400 text-xs font-medium block text-center mb-3">
						{currentNote.date
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
						value={currentNote.title || ''}
						onChange={e => updateCurrentNote({ title: e.target.value })}
						placeholder="Title"
						aria-label="Note title"
						className="text-ios-title1 mb-2 w-full border-none outline-none placeholder-gray-400 bg-transparent text-black dark:text-white"
					/>
				</div>
				<textarea
					ref={bodyRef}
					value={currentNote.content || ''}
					onChange={e => {
						updateCurrentNote({ content: e.target.value });
						setActiveStyle(detectBlockStyle(e.target.value, e.target.selectionStart));
					}}
					onSelect={syncStyleFromCursor}
					onKeyUp={syncStyleFromCursor}
					onClick={syncStyleFromCursor}
					placeholder="Type something..."
					aria-label="Note content"
					className="w-full flex-1 resize-none border-none outline-none text-[15px] leading-relaxed bg-transparent placeholder-gray-400 text-gray-800 dark:text-gray-200"
				/>
			</div>

			{/* Formatting Toolbar Floating Glass Capsule */}
			{showFormatToolbar && (
				<FormatToolbar
					activeStyle={activeStyle}
					activeInline={activeInline}
					onClose={() => setShowFormatToolbar(false)}
					onFormat={applyFormat}
				/>
			)}
		</div>
	);
}
