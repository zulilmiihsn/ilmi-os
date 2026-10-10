'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Trash2, Archive, Check, Flag, Star } from 'lucide-react';
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
    const mouseDown = useRef(false);
    const dragDistance = useRef(0);

    const swipeStart = (clientX: number) => {
        if (isEditing) return;
        startX.current = clientX;
        dragDistance.current = 0;
    };

    const swipeMove = (clientX: number) => {
        if (startX.current === null || isEditing) return;
        const diff = clientX - startX.current;
        dragDistance.current = Math.max(dragDistance.current, Math.abs(diff));
        // Only allow swiping left
        if (diff < 0) {
            setOffset(Math.max(diff, -140)); // Max swipe distance
        }
    };

    const swipeEnd = () => {
        if (startX.current === null || isEditing) return;
        if (offset < -70) {
            triggerHaptic('light');
            setOffset(-140);
        } else {
            setOffset(0);
        }
        startX.current = null;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        swipeStart(touch.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        swipeMove(touch.clientX);
    };

    const handleTouchEnd = () => {
        swipeEnd();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        mouseDown.current = true;
        swipeStart(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (mouseDown.current) swipeMove(e.clientX);
    };

    const handleMouseUp = () => {
        if (!mouseDown.current) return;
        mouseDown.current = false;
        swipeEnd();
    };

    const handleMouseLeave = () => {
        mouseDown.current = false;
    };

    // Reset swipe when editing or selection changes
    useEffect(() => {
        if ((isEditing || isSelected) && offset !== 0) {
            setOffset(0);
        }
    }, [isEditing, isSelected, offset]);

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
                    tabIndex={offset === 0 ? -1 : 0}
                    className="h-full w-[70px] bg-ios-red text-white flex flex-col items-center justify-center active:brightness-90 transition-all"
                >
                    <Trash2 aria-hidden="true" size={16} className="mb-1" />
                    <span className="text-[11px] font-medium">Trash</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onArchive();
                        setOffset(0);
                    }}
                    tabIndex={offset === 0 ? -1 : 0}
                    className="h-full w-[70px] bg-ios-indigo text-white flex flex-col items-center justify-center active:brightness-90 transition-all"
                >
                    <Archive aria-hidden="true" size={16} className="mb-1" />
                    <span className="text-[11px] font-medium">Archive</span>
                </button>
            </div>

            {/* Foreground Content */}
            <div
                role="button"
                tabIndex={0}
                aria-label={`${email.from}, ${email.subject}`}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (offset === 0) onClick();
                        else setOffset(0);
                    }
                }}
                className={`relative transition-transform duration-200 ease-out select-none ${
                    darkMode ? 'bg-black active:bg-[#1c1c1e]' : 'bg-white active:bg-gray-50'
                } ${isSelected && !isEditing ? (darkMode ? 'bg-[#1c1c1e]' : 'bg-ios-blue/10') : ''}`}
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                    // A real drag ends with a click: swallow it so the
                    // revealed actions stay visible instead of toggling.
                    if (dragDistance.current > 10) {
                        dragDistance.current = 0;
                        return;
                    }
                    if (offset === 0) onClick();
                    else setOffset(0);
                }}
            >
                <div className="flex items-start px-4 py-3 cursor-pointer">
                    {/* Left Unread Indicator Dot */}
                    <div className="w-4 pt-1.5 shrink-0 flex items-center justify-start">
                        {!email.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-ios-blue shadow-sm"></div>
                        )}
                    </div>

                    {/* Edit Checkbox */}
                    {isEditing && (
                        <div className="mr-3 pt-0.5 shrink-0 flex items-center justify-center">
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    isChecked
                                        ? 'bg-ios-blue border-ios-blue text-white'
                                        : darkMode
                                        ? 'border-gray-600'
                                        : 'border-gray-300'
                                }`}
                            >
                                {isChecked && <Check aria-hidden="true" size={10} />}
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
                                {email.isFlagged && <Flag aria-hidden="true" size={12} className="text-ios-orange" />}
                                {email.isVip && <Star aria-hidden="true" size={12} className="text-ios-yellow" />}
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
