'use client';

import { useRef } from 'react';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../../utils/hooks/useFocusTrap';

interface RenameDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onRename: () => void;
	value: string;
	onValueChange: (val: string) => void;
	darkMode: boolean;
}

export default function RenameDialog({
	isOpen,
	onClose,
	onRename,
	value,
	onValueChange,
	darkMode,
}: RenameDialogProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(isOpen, rootRef);
	useFocusTrap(isOpen, rootRef);
	if (!isOpen) return null;

	const theme = {
		modalBg: darkMode ? 'bg-ios-dark-gray6/80' : 'bg-ios-gray6/80',
		text: darkMode ? 'text-white' : 'text-black',
		modalInputBg: darkMode ? 'bg-ios-dark-gray5' : 'bg-white',
	};

	return (
		<div
			ref={rootRef}
			onKeyDown={e => {
				if (e.key === 'Escape') onClose();
			}}
			className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 animate-fade-in"
		>
			<div
				className={`${theme.modalBg} backdrop-blur-md rounded-2xl w-72 p-0 shadow-2xl animate-scale-in transition-colors`}
			>
				<div className="p-4 text-center">
					<h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Rename</h3>
					<input
						type="text"
						value={value}
						onChange={e => onValueChange(e.target.value)}
						className={`w-full px-3 py-2 rounded-lg border-none outline-none text-center mt-2 ${theme.modalInputBg}`}
						autoFocus
					/>
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
						onClick={onRename}
						disabled={!value.trim()}
						className="flex-1 py-3 text-ios-blue font-semibold active:bg-ios-blue/10 disabled:text-ios-gray transition-colors"
					>
						Rename
					</button>
				</div>
			</div>
		</div>
	);
}
