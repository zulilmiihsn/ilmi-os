'use client';

import { memo } from 'react';
import { Email } from './types';
import { triggerHaptic } from '../../../utils/haptic';

interface EmailDetailProps {
    email: Email;
    mailboxName?: string;
    onBack: () => void;
    onReply: () => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    darkMode: boolean;
}

function EmailDetail({
    email,
    mailboxName = 'All Inboxes',
    onBack,
    onReply,
    onDelete,
    onArchive,
    darkMode,
}: EmailDetailProps) {
    return (
        <div className={`flex flex-col h-full select-none ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {/* Native iOS Detail Header */}
            <div
                className={`flex items-center justify-between px-4 pt-10 pb-2 border-b shrink-0 ${
                    darkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-gray-100'
                } backdrop-blur-md sticky top-0 z-10`}
            >
                <button
                    onClick={() => {
                        triggerHaptic('light');
                        onBack();
                    }}
                    className="flex items-center text-[#007aff] text-base font-normal active:opacity-60 transition-opacity"
                >
                    <i className="fas fa-chevron-left text-lg mr-1.5"></i>
                    <span>{mailboxName}</span>
                </button>
                <div className="flex items-center gap-5 text-[#007aff] text-base">
                    <button onClick={() => triggerHaptic('light')} className="active:opacity-60 transition-opacity">
                        <i className="fas fa-chevron-up"></i>
                    </button>
                    <button onClick={() => triggerHaptic('light')} className="active:opacity-60 transition-opacity">
                        <i className="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            {/* Email Message Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Sender Info Row */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {/* Avatar Initial */}
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold shadow-inner ${
                                darkMode ? 'bg-[#2c2c2e] text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {email.from.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-black'}`}>
                                    {email.from}
                                </span>
                                {email.isVip && <i className="fas fa-star text-[#ffcc00] text-xs"></i>}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">To: Me</div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 font-normal pt-1">
                        {email.date}
                    </div>
                </div>

                {/* Subject Title */}
                <h1 className={`text-xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    {email.subject}
                </h1>

                {/* Formatted Date & Time */}
                <div className="text-xs text-gray-400 mb-6 pb-3 border-b border-gray-100 dark:border-white/10">
                    {new Date(email.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>

                {/* Email Body */}
                <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {email.preview}
                    {'\n\n'}
                    Hi, Ashley found this photo from back in 2018. Can you believe it's been years? Let's start planning our reunion!
                    {'\n\n'}
                    Best regards,
                    {'\n'}
                    {email.from}
                </div>
            </div>

            {/* Floating Liquid Glass Action Toolbar (iOS 26 Style 5 Actions) */}
            <div className="shrink-0 p-4 pb-8 flex items-center justify-center">
                <div
                    className={`w-full max-w-[340px] px-6 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all ${
                        darkMode
                            ? 'bg-[#1c1c1e]/80 border-white/15 text-white'
                            : 'bg-white/80 border-black/5 text-black'
                    }`}
                >
                    {/* Trash */}
                    <button
                        onClick={() => {
                            triggerHaptic('medium');
                            onDelete(email.id);
                        }}
                        className="text-[#007aff] p-1.5 text-base active:scale-90 transition-transform"
                        aria-label="Delete Email"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>

                    {/* Archive / Folder */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onArchive(email.id);
                        }}
                        className="text-[#007aff] p-1.5 text-base active:scale-90 transition-transform"
                        aria-label="Archive Email"
                    >
                        <i className="fas fa-folder-open"></i>
                    </button>

                    {/* Reply */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onReply();
                        }}
                        className="text-[#007aff] p-1.5 text-base active:scale-90 transition-transform"
                        aria-label="Reply Email"
                    >
                        <i className="fas fa-reply"></i>
                    </button>

                    {/* Flag */}
                    <button
                        onClick={() => triggerHaptic('light')}
                        className="text-[#007aff] p-1.5 text-base active:scale-90 transition-transform"
                        aria-label="Flag Email"
                    >
                        <i className="fas fa-flag"></i>
                    </button>

                    {/* Compose */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onReply();
                        }}
                        className="text-[#007aff] p-1.5 text-base active:scale-90 transition-transform"
                        aria-label="New Email"
                    >
                        <i className="far fa-edit"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(EmailDetail);
