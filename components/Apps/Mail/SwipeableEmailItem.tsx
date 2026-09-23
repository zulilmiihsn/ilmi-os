'use client';

import { useState, useRef, memo } from 'react';
import { Email } from './types';
import { triggerHaptic } from '../../../utils/haptic';

interface SwipeableEmailItemProps {
    email: Email;
    isSelected: boolean;
    isEditing: boolean;
    isChecked: boolean;
    onClick: () => void;
    onDelete: () => void;
    onArchive: () => void;
    darkMode: boolean;
}

function SwipeableEmailItem({
    email,
    isSelected,
    isEditing,
    isChecked,
    onClick,
    onDelete,
    onArchive,
    darkMode,
}: SwipeableEmailItemProps) {
    const [offset, setOffset] = useState(0);
    const startX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isEditing) return;
        const touch = e.touches[0];
        if (!touch) return;
        startX.current = touch.clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null || isEditing) return;
        const touch = e.touches[0];
        if (!touch) return;
        const currentX = touch.clientX;
        const diff = currentX - startX.current;
        // Only allow swiping left
        if (diff < 0) {
            setOffset(Math.max(diff, -140)); // Max swipe distance
        }
    };

    const handleTouchEnd = () => {
        if (startX.current === null || isEditing) return;
        if (offset < -70) {
            triggerHaptic('light');
            setOffset(-140);
        } else {
            setOffset(0);
        }
        startX.current = null;
    };

    // Reset swipe when editing or selection changes
    if ((isEditing || isSelected) && offset !== 0) {
        setOffset(0);
    }

    return (
        <div className="relative overflow-hidden border-b border-gray-100 dark:border-white/10 last:border-b-0">
            {/* Swipe Actions Background */}
            <div className="absolute inset-0 flex flex-row-reverse">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('medium');
                        onDelete();
                    }}
                    className="h-full w-[70px] bg-[#ff3b30] text-white flex flex-col items-center justify-center active:brightness-90 transition-all"
                >
                    <i className="fas fa-trash-alt text-base mb-1"></i>
                    <span className="text-[11px] font-medium">Trash</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onArchive();
                        setOffset(0);
                    }}
                    className="h-full w-[70px] bg-[#5856d6] text-white flex flex-col items-center justify-center active:brightness-90 transition-all"
                >
                    <i className="fas fa-archive text-base mb-1"></i>
                    <span className="text-[11px] font-medium">Archive</span>
                </button>
            </div>

            {/* Foreground Content */}
            <div
                className={`relative transition-transform duration-200 ease-out select-none ${
                    darkMode ? 'bg-black active:bg-[#1c1c1e]' : 'bg-white active:bg-gray-50'
                } ${isSelected && !isEditing ? (darkMode ? 'bg-[#1c1c1e]' : 'bg-[#e8f0fe]') : ''}`}
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (offset === 0) onClick();
                    else setOffset(0);
                }}
            >
                <div className="flex items-start px-4 py-3 cursor-pointer">
                    {/* Left Unread Indicator Dot */}
                    <div className="w-4 pt-1.5 shrink-0 flex items-center justify-start">
                        {!email.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#007aff] shadow-sm"></div>
                        )}
                    </div>

                    {/* Edit Checkbox */}
                    {isEditing && (
                        <div className="mr-3 pt-0.5 shrink-0 flex items-center justify-center">
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    isChecked
                                        ? 'bg-[#007aff] border-[#007aff] text-white'
                                        : darkMode
                                        ? 'border-gray-600'
                                        : 'border-gray-300'
                                }`}
                            >
                                {isChecked && <i className="fas fa-check text-[10px]"></i>}
                            </div>
                        </div>
                    )}

                    {/* Email Content Body */}
                    <div className="flex-1 min-w-0 pr-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <h3
                                className={`text-[16px] truncate pr-2 tracking-tight ${
                                    !email.read
                                        ? 'font-bold ' + (darkMode ? 'text-white' : 'text-black')
                                        : 'font-normal ' + (darkMode ? 'text-gray-300' : 'text-gray-900')
                                }`}
                            >
                                {email.from}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {email.isFlagged && <i className="fas fa-flag text-[#ff9500] text-xs"></i>}
                                {email.isVip && <i className="fas fa-star text-[#ffcc00] text-xs"></i>}
                                <span className="text-[13px] text-gray-400 font-normal">
                                    {email.date}
                                </span>
                            </div>
                        </div>

                        {/* Subject */}
                        <div
                            className={`text-[14px] leading-tight mb-1 truncate ${
                                !email.read
                                    ? 'font-semibold ' + (darkMode ? 'text-white' : 'text-black')
                                    : 'font-normal ' + (darkMode ? 'text-gray-300' : 'text-gray-800')
                            }`}
                        >
                            {email.subject}
                        </div>

                        {/* 2-line snippet preview */}
                        <div className="text-[13px] leading-snug text-gray-400 dark:text-gray-500 line-clamp-2">
                            {email.preview}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(SwipeableEmailItem);
