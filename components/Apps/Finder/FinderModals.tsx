'use client';

import React, { useRef } from 'react';
import { formatFileSize } from '../../../utils/fileSystem';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { DialogState } from './types';

interface FinderModalsProps {
	dialog: DialogState;
	dialogInput: string;
	setDialogInput: (value: string) => void;
	setDialog: (dialog: DialogState) => void;
	dialogError: string | null;
	handleCreateFolder: () => void;
	handleCreateFile: () => void;
	handleRename: () => void;
	handleDelete: () => void;
}

export const FinderModals: React.FC<FinderModalsProps> = ({
	dialog,
	dialogInput,
	setDialogInput,
	setDialog,
	dialogError,
	handleCreateFolder,
	handleCreateFile,
	handleRename,
	handleDelete,
}) => {
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(dialog.type !== null, rootRef);
	if (!dialog.type) return null;

	return (
		<div
			ref={rootRef}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-in fade-in duration-150"
		>
			<div className="bg-white dark:bg-[#2A2A2A] rounded-xl shadow-2xl border border-black/10 dark:border-white/10 w-80 p-5 text-gray-800 dark:text-gray-200">
				{dialogError && (
					<div
						role="alert"
						className="mb-3 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
					>
						{dialogError}
					</div>
				)}
				{dialog.type === 'createFolder' && (
					<>
						<h3 className="font-semibold text-sm mb-3">New Folder</h3>
						<input
							type="text"
							autoFocus
							value={dialogInput}
							onChange={e => setDialogInput(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
							className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setDialog({ type: null })}
								className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								onClick={handleCreateFolder}
								className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
							>
								Create
							</button>
						</div>
					</>
				)}

				{dialog.type === 'createFile' && (
					<>
						<h3 className="font-semibold text-sm mb-3">New File</h3>
						<input
							type="text"
							autoFocus
							value={dialogInput}
							onChange={e => setDialogInput(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleCreateFile()}
							className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setDialog({ type: null })}
								className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								onClick={handleCreateFile}
								className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
							>
								Create
							</button>
						</div>
					</>
				)}

				{dialog.type === 'rename' && (
					<>
						<h3 className="font-semibold text-sm mb-3">Rename Item</h3>
						<input
							type="text"
							autoFocus
							value={dialogInput}
							onChange={e => setDialogInput(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleRename()}
							className="w-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 mb-4"
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setDialog({ type: null })}
								className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								onClick={handleRename}
								className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 font-medium"
							>
								Rename
							</button>
						</div>
					</>
				)}

				{dialog.type === 'delete' && (
					<>
						<h3 className="font-semibold text-sm mb-2 text-red-500">Delete Item?</h3>
						<p className="text-xs text-gray-500 mb-4">
							Are you sure you want to delete &quot;{dialog.targetItem?.name}&quot;?
						</p>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setDialog({ type: null })}
								className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								className="px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 font-medium"
							>
								Delete
							</button>
						</div>
					</>
				)}

				{dialog.type === 'preview' && dialog.targetItem && (
					<>
						<div className="flex justify-between items-center mb-3">
							<h3 className="font-semibold text-sm truncate">{dialog.targetItem.name}</h3>
							<button
								onClick={() => setDialog({ type: null })}
								className="text-gray-400 hover:text-gray-600"
								aria-label="Close preview"
							>
								×
							</button>
						</div>
						<div className="bg-gray-50 dark:bg-black/40 rounded-md p-3 text-xs font-mono max-h-48 overflow-y-auto mb-3 whitespace-pre-wrap">
							{dialog.targetItem.content || '(Empty file)'}
						</div>
						<div className="flex justify-between items-center text-[11px] text-gray-400">
							<span>Size: {formatFileSize(dialog.targetItem.size || 0)}</span>
							<button
								onClick={() => setDialog({ type: null })}
								className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white"
							>
								Done
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
