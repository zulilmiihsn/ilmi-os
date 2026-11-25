'use client';

import React from 'react';

interface AddEventSheetProps {
	sheetRef: React.RefObject<HTMLDivElement>;
	selectedDate: Date;
	newTitle: string;
	setNewTitle: (title: string) => void;
	onClose: () => void;
	onAdd: () => void;
}

export function AddEventSheet({
	sheetRef,
	selectedDate,
	newTitle,
	setNewTitle,
	onClose,
	onAdd,
}: AddEventSheetProps) {
	return (
		<div
			className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
			onClick={onClose}
		>
			<div
				ref={sheetRef}
				onKeyDown={e => {
					if (e.key === 'Escape') onClose();
				}}
				onClick={e => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Add event"
				className="w-72 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
			>
				<div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
					<h2 className="text-base font-semibold text-center">New Event</h2>
					<p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-0.5">
						{selectedDate.toLocaleDateString(undefined, {
							weekday: 'long',
							month: 'long',
							day: 'numeric',
						})}
					</p>
				</div>
				<div className="p-4">
					<input
						type="text"
						value={newTitle}
						onChange={e => setNewTitle(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') onAdd();
						}}
						placeholder="Event title"
						aria-label="Event title"
						autoFocus
						className="w-full bg-black/5 dark:bg-white/10 rounded-lg px-3 py-2 text-sm outline-none placeholder-gray-400"
					/>
				</div>
				<div className="flex divide-x divide-black/5 dark:divide-white/10 border-t border-black/5 dark:border-white/10">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-3 text-sm text-ios-red font-medium active:bg-black/5 dark:active:bg-white/10 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onAdd}
						disabled={!newTitle.trim()}
						className="flex-1 py-3 text-sm text-ios-red font-semibold active:bg-black/5 dark:active:bg-white/10 transition-colors disabled:opacity-40"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	);
}
