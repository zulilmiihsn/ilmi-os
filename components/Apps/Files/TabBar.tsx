'use client';

import { useMemo } from "react";

interface TabBarProps {
    activeTab: 'recents' | 'shared' | 'browse';
    onTabChange: (tab: 'recents' | 'shared' | 'browse') => void;
    darkMode: boolean;
}

export default function TabBar({ activeTab, onTabChange, darkMode }: TabBarProps) {
    // Reconstruct theme for tab bar specifically
    const theme = useMemo(() => ({
        tabBarBg: darkMode ? 'bg-ios-dark-gray6/90 backdrop-blur-md border-ios-dark-separator' : 'bg-ios-gray6/90 backdrop-blur-md border-ios-separator',
        tabHighlight: darkMode ? 'bg-ios-blue/20' : 'bg-ios-blue/10',
        activeTab: 'text-ios-blue',
        inactiveTab: darkMode ? 'text-ios-gray' : 'text-ios-gray',
    }), [darkMode]);

    return (
        <div className={`border-t pb-safe transition-colors ${theme.tabBarBg}`}>
            <div className="flex items-center justify-around px-4 pt-2 pb-4">
                <button
                    onClick={() => onTabChange('recents')}
                    className="flex flex-col items-center justify-center py-2 px-4 transition-all duration-200"
                >
                    <div
                        className={`px-4 py-2 rounded-full transition-all duration-200 mb-1 ${activeTab === 'recents' ? theme.tabHighlight : 'bg-transparent'
                            }`}
                    >
                        <svg
                            className={`w-6 h-6 transition-colors duration-200 ${activeTab === 'recents' ? theme.activeTab : theme.inactiveTab
                                }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                    </div>
                    <span
                        className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'recents' ? theme.activeTab : theme.inactiveTab
                            }`}
                    >
                        Recents
                    </span>
                </button>

                <button
                    onClick={() => onTabChange('shared')}
                    className="flex flex-col items-center justify-center py-2 px-4 transition-all duration-200"
                >
                    <div
                        className={`px-4 py-2 rounded-full transition-all duration-200 mb-1 ${activeTab === 'shared' ? theme.tabHighlight : 'bg-transparent'
                            }`}
                    >
                        <svg
                            className={`w-6 h-6 transition-colors duration-200 ${activeTab === 'shared' ? theme.activeTab : theme.inactiveTab
                                }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
                        </svg>
                    </div>
                    <span
                        className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'shared' ? theme.activeTab : theme.inactiveTab
                            }`}
                    >
                        Shared
                    </span>
                </button>

                <button
                    onClick={() => onTabChange('browse')}
                    className="flex flex-col items-center justify-center py-2 px-4 transition-all duration-200"
                >
                    <div
                        className={`px-4 py-2 rounded-full transition-all duration-200 mb-1 ${activeTab === 'browse' ? theme.tabHighlight : 'bg-transparent'
                            }`}
                    >
                        <svg
                            className={`w-6 h-6 transition-colors duration-200 ${activeTab === 'browse' ? theme.activeTab : theme.inactiveTab
                                }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                        </svg>
                    </div>
                    <span
                        className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'browse' ? theme.activeTab : theme.inactiveTab
                            }`}
                    >
                        Browse
                    </span>
                </button>
            </div>
        </div>
    );
}

