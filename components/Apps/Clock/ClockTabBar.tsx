'use client';

import { memo } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

type TabType = 'world' | 'alarms' | 'stopwatch' | 'timers';

interface ClockTabBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: 'world' | 'alarm' | 'stopwatch' | 'timer' }[] = [
    { id: 'world', label: 'World Clock', icon: 'world' },
    { id: 'alarms', label: 'Alarms', icon: 'alarm' },
    { id: 'stopwatch', label: 'Stopwatch', icon: 'stopwatch' },
    { id: 'timers', label: 'Timers', icon: 'timer' },
];

function ClockTabBar({ activeTab, onTabChange }: ClockTabBarProps) {
    const renderIcon = (icon: string, isActive: boolean) => {
        const className = 'w-6 h-6 mb-1';

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
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={isActive ? '2' : '1.5'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="13" r="7" />
                        <path d="M12 13V9.5M12 13l2.5 1.5" />
                        <path d="M5.6 6.6L3.8 4M18.4 6.6l1.8-2.6" />
                        <path d="M9 20l-1.5 2M15 20l1.5 2" />
                    </svg>
                );
            case 'stopwatch':
                return (
                    <svg
                        className={className}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={isActive ? '2' : '1.5'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="13" r="7" />
                        <path d="M12 13V9M12 13l2.5 2" />
                        <path d="M10 2.5h4M12 2.5V6" />
                        <path d="M18.2 7.2l1.6-1.6" />
                    </svg>
                );
            case 'timer':
                return (
                    <svg
                        className={className}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={isActive ? '2' : '1.5'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="13" r="7" />
                        <path d="M12 13V8.5" />
                        <path d="M10 2.5h4M12 2.5V6" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="shrink-0 p-4 pb-[max(env(safe-area-inset-bottom),2rem)] flex items-center justify-center select-none">
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
                            className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 after:absolute after:-inset-y-0.5 after:content-[''] ${
                                isActive
                                    ? 'text-[#ff9f0a]'
                                    : 'text-ios-gray hover:text-gray-600'
                            }`}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={tab.label}
                        >
                            {renderIcon(tab.icon, isActive)}
                            <span className="text-[11px] font-medium tracking-tight">
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
