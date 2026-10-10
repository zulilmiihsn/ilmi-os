'use client';

import { useRef } from 'react';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../../utils/hooks/useFocusTrap';

interface ActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    onRename: () => void;
    onDelete: () => void;
    darkMode: boolean;
}

export default function ActionSheet({
    isOpen,
    onClose,
    itemName,
    onRename,
    onDelete,
    darkMode,
}: ActionSheetProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    useRestoreFocus(isOpen, rootRef);
    useFocusTrap(isOpen, rootRef);

    if (!isOpen) return null;

    const theme = {
        text: darkMode ? 'text-white' : 'text-black',
    };

    return (
        <div
            ref={rootRef}
            onKeyDown={e => {
                if (e.key === 'Escape') onClose();
            }}
            className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-end justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`${darkMode ? 'bg-ios-dark-gray6/95 border-ios-dark-separator' : 'bg-white/95 border-ios-separator/50'} backdrop-blur-md rounded-t-2xl w-full max-w-md pb-safe animate-slide-up shadow-2xl transition-colors`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-4 border-b ${darkMode ? 'border-ios-dark-separator' : 'border-ios-separator/50'}`}>
                    <h3 className={`text-center font-semibold ${theme.text}`}>{itemName}</h3>
                </div>
                <div className={`divide-y ${darkMode ? 'divide-ios-dark-separator' : 'divide-ios-separator/50'}`}>
                    <button
                        onClick={onRename}
                        className="w-full py-4 text-center text-ios-blue font-medium active:bg-ios-gray6/10 transition-colors"
                    >
                        Rename
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full py-4 text-center text-ios-red font-medium active:bg-ios-gray6/10 transition-colors"
                    >
                        Delete
                    </button>
                </div>
                <div className={`h-2 ${darkMode ? 'bg-ios-dark-gray5' : 'bg-ios-gray6/50'}`} />
                <button
                    onClick={onClose}
                    className="w-full py-4 text-center text-ios-blue font-semibold active:bg-ios-gray6/10 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
