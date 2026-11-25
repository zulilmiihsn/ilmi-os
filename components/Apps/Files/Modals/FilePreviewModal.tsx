'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { formatDate, formatFileSize } from '../../../../utils/fileSystem';
import { useFocusTrap } from '../../../../utils/hooks/useFocusTrap';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';
import type { FileItem } from '../types';

interface FilePreviewModalProps {
	item: FileItem | null;
	onClose: () => void;
	darkMode: boolean;
}

export default function FilePreviewModal({ item, onClose, darkMode }: FilePreviewModalProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(Boolean(item), rootRef);
	useFocusTrap(Boolean(item), rootRef);

	if (!item) return null;

	return (
		<div
			ref={rootRef}
			onKeyDown={e => {
				if (e.key === 'Escape') {
					e.stopPropagation();
					onClose();
				}
			}}
			onClick={onClose}
			className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={item.name}
				onClick={e => e.stopPropagation()}
				className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border ${
					darkMode
						? 'bg-[#1c1c1e] border-white/10 text-white'
						: 'bg-white border-black/10 text-black'
				}`}
			>
				<div
					className={`flex items-center justify-between px-4 py-3 border-b ${
						darkMode ? 'border-white/10' : 'border-black/5'
					}`}
				>
					<div className="min-w-0 pr-2">
						<h3 className="text-sm font-semibold truncate">{item.name}</h3>
						<p className="text-[11px] text-gray-500 dark:text-gray-400">
							{typeof item.size === 'number' ? formatFileSize(item.size) : '0 B'} ·{' '}
							{formatDate(item.modified)}
						</p>
					</div>
					<button
						type="button"
						autoFocus
						onClick={onClose}
						aria-label="Close quick look"
						className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors shrink-0"
					>
						<X aria-hidden="true" size={14} />
					</button>
				</div>

				<div className="p-4">
					<div
						className={`rounded-xl p-3 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap break-words ${
							darkMode ? 'bg-black/50 text-gray-200' : 'bg-[#f2f2f7] text-gray-800'
						}`}
					>
						{item.content || '(Empty file)'}
					</div>
				</div>

				<div
					className={`flex justify-end px-4 py-2.5 border-t ${
						darkMode ? 'border-white/10' : 'border-black/5'
					}`}
				>
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-1.5 rounded-full bg-ios-blue text-white text-xs font-semibold active:scale-95 transition-transform"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
