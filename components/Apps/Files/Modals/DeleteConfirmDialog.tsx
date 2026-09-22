'use client';

import { useRef } from 'react';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';

interface DeleteConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	darkMode: boolean;
}

export default function DeleteConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	darkMode,
}: DeleteConfirmDialogProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(isOpen, rootRef);
	if (!isOpen) return null;

	const theme = {
		modalBg: darkMode ? 'bg-ios-dark-gray6/80' : 'bg-ios-gray6/80',
		text: darkMode ? 'text-white' : 'text-black',
		textSecondary: darkMode ? 'text-ios-gray' : 'text-ios-gray',
	};

	return (
		<div
			ref={rootRef}
			className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 animate-fade-in"
		>
			<div
				className={`${theme.modalBg} backdrop-blur-md rounded-2xl w-72 p-0 shadow-2xl animate-scale-in transition-colors`}
			>
				<div className="p-4 text-center">
					<h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Delete Item?</h3>
					<p className={`text-sm mb-4 ${theme.textSecondary}`}>This action cannot be undone.</p>
				</div>
				<div
					className={`flex border-t ${darkMode ? 'border-ios-dark-separator' : 'border-ios-gray4/50'}`}
				>
					<button
						onClick={onClose}
						className="flex-1 py-3 text-ios-blue font-medium active:bg-ios-gray6/10 transition-colors"
					>
						Cancel
					</button>
					<div className={`w-px ${darkMode ? 'bg-ios-dark-separator' : 'bg-ios-gray4'}`} />
					<button
						onClick={onConfirm}
						className="flex-1 py-3 text-ios-red font-semibold active:bg-ios-red/10 transition-colors"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
