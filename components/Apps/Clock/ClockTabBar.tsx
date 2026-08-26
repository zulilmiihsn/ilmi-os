'use client';

import { memo } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

type TabType = 'world' | 'alarms' | 'stopwatch' | 'timers';

interface ClockTabBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    theme: {
        tabBar: string;
        tabText: string;
        tabTextInactive: string;
    };
}

const tabs: { id: TabType; label: string; icon: 'world' | 'alarm' | 'stopwatch' | 'timer' }[] = [
    { id: 'world', label: 'World Clock', icon: 'world' },
    { id: 'alarms', label: 'Alarms', icon: 'alarm' },
    { id: 'stopwatch', label: 'Stopwatch', icon: 'stopwatch' },
    { id: 'timers', label: 'Timers', icon: 'timer' },
];

function ClockTabBar({ activeTab, onTabChange }: ClockTabBarProps) {
    const renderIcon = (icon: string, isActive: boolean) => {
        const className = 'w-5 h-5 mb-1';

        switch (icon) {
            case 'world':
                return (
                    <svg
                        className={className}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={isActive ? '2' : '1.5'}
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                );
            case 'alarm':
                return (
                    <svg
                        className={className}
                        fill={isActive ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                );
            case 'stopwatch':
                return (
                    <svg
                        className={className}
                        fill={isActive ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                );
            case 'timer':
                return (
                    <svg
                        className={className}
                        fill={isActive ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path d="M15.07 1.01h-6v2h6v-2zm-4 13h2v-6h-2v6zm8.03-6.62l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.14 4.74 14.19 4 12.07 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.11-.74-4.06-1.97-5.61zm-7.03 12.61c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="shrink-0 p-4 pb-8 flex items-center justify-center select-none">
            <div
                className="w-full max-w-[360px] px-3 py-2 rounded-full backdrop-blur-2xl flex items-center justify-around border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15"
                role="tablist"
            >
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                triggerHaptic('light');
                                onTabChange(tab.id);
                            }}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                                isActive
                                    ? 'text-[#ff9f0a]'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                            }`}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={tab.label}
                        >
                            {renderIcon(tab.icon, isActive)}
                            <span className="text-[10px] font-medium tracking-tight">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(ClockTabBar);
