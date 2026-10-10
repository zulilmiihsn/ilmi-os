'use client';

import { memo } from 'react';
import {
    Archive,
    CircleX,
    Cloud,
    File,
    FileText,
    Flag,
    Inbox,
    Layers,
    Mail as MailIcon,
    Send,
    Star,
    Trash2,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';
import { Mailbox } from './types';

// FontAwesome class names from mailbox data mapped to Lucide.
// Inbox-style keys from mailbox data mapped to Lucide.
// Brand providers (google, yahoo) have no Lucide equivalent: generic Mail.
const MAILBOX_ICONS: Record<string, LucideIcon> = {
    'layer-group': Layers,
    'cloud': Cloud,
    'google': MailIcon,
    'yahoo': MailIcon,
    'star': Star,
    'flag': Flag,
    'file-alt': FileText,
    'paper-plane': Send,
    'times-circle': CircleX,
    'trash-alt': Trash2,
    'archive': Archive,
    'inbox': Inbox,
    'file': File,
};

interface MailboxItemProps {
    item: Mailbox;
    isActive: boolean;
    onClick: () => void;
    darkMode: boolean;
    dimmed?: boolean;
}

function MailboxItem({ item, isActive, onClick, darkMode, dimmed }: MailboxItemProps) {
    const ItemIcon = MAILBOX_ICONS[item.icon] ?? File;
    return (
        <div
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={item.name}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors border-b last:border-b-0 ${dimmed ? 'opacity-40' : ''} ${
                darkMode
                    ? 'border-white/10 hover:bg-white/5 active:bg-white/10'
                    : 'border-gray-100 hover:bg-gray-50 active:bg-gray-100'
            } ${isActive ? (darkMode ? 'bg-white/10' : 'bg-ios-blue/10') : ''}`}
        >
            <div className="flex items-center gap-3.5">
                <div className={`w-6 text-center text-base ${item.type === 'smart' ? 'text-ios-blue' : 'text-gray-400'}`}>
                    <ItemIcon aria-hidden="true" size={16} />
                </div>
                <span className={`text-base font-normal ${darkMode ? 'text-white' : 'text-black'}`}>
                    {item.name}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {item.count !== undefined && item.count > 0 && (
                    <span className="text-gray-400 text-sm font-medium">{item.count}</span>
                )}
                <ChevronRight aria-hidden="true" size={12} className="text-gray-300 dark:text-gray-600" />
            </div>
        </div>
    );
}

export default memo(MailboxItem);
