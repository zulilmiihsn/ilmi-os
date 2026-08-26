'use client';

import { memo } from 'react';
import { Mailbox } from './types';

interface MailboxItemProps {
    item: Mailbox;
    isActive: boolean;
    onClick: () => void;
    darkMode: boolean;
}

function MailboxItem({ item, isActive, onClick, darkMode }: MailboxItemProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors border-b last:border-b-0 ${
                darkMode
                    ? 'border-white/10 hover:bg-white/5 active:bg-white/10'
                    : 'border-gray-100 hover:bg-gray-50 active:bg-gray-100'
            } ${isActive ? (darkMode ? 'bg-white/10' : 'bg-blue-50') : ''}`}
        >
            <div className="flex items-center gap-3.5">
                <div className={`w-6 text-center text-base ${item.type === 'smart' ? 'text-[#007aff]' : 'text-gray-400'}`}>
                    <i className={`fas ${item.icon}`}></i>
                </div>
                <span className={`text-base font-normal ${darkMode ? 'text-white' : 'text-black'}`}>
                    {item.name}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {item.count !== undefined && item.count > 0 && (
                    <span className="text-gray-400 text-sm font-medium">{item.count}</span>
                )}
                <i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 text-xs"></i>
            </div>
        </div>
    );
}

export default memo(MailboxItem);
