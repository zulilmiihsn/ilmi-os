'use client';

import Image from 'next/image';
import type { Note } from '../types';

interface NoteItemProps {
	note: Note;
	onClick: (note: Note) => void;
	selectionMode: boolean;
	isLast: boolean;
}

export default function NoteItem({ note, onClick, selectionMode, isLast }: NoteItemProps) {
	return (
		<div
			onClick={() => onClick(note)}
			className="flex pl-4 pr-0 py-0 active:bg-gray-200 dark:active:bg-[#2C2C2E] transition-colors cursor-pointer group"
		>
			{selectionMode && (
				<div className="flex items-center justify-center mr-3 py-3 animate-in slide-in-from-left-2 duration-200">
					<div
						className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
							note.selected ? 'bg-[#DCA326] border-[#DCA326]' : 'border-gray-400 bg-transparent'
						}`}
					>
						{note.selected && (
							<svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
							</svg>
						)}
					</div>
				</div>
			)}

			<div className={`flex-1 flex py-3 pr-4 ${!isLast ? 'border-b border-gray-200 dark:border-white/10' : ''}`}>
				<div className="flex-1 min-w-0 mr-2">
					<h3 className="text-sm font-semibold text-black dark:text-white truncate leading-tight mb-0.5">
						{note.title || 'New Note'}
					</h3>
					<div className="flex items-start text-xs text-gray-500 dark:text-gray-400 leading-snug">
						<span className="mr-2 whitespace-nowrap">
							{new Date(note.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
						</span>
						<span className="truncate">{note.content || 'No additional text'}</span>
					</div>
					<div className="flex items-center text-[11px] text-gray-400 mt-1.5">
						<svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						{note.folder}
					</div>
				</div>

				{note.hasImage && note.imageSrc && (
					<div className="w-12 h-12 rounded-[6px] overflow-hidden shrink-0 bg-gray-200 self-start mt-0.5 relative">
						<Image
							src={note.imageSrc}
							alt=""
							fill
							className="object-cover"
							unoptimized={note.imageSrc.startsWith('data:')}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
