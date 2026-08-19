'use client';

import { memo, ComponentType } from 'react';
import StatusBar from '../StatusBar';

interface StatusBarColors {
    backgroundColor: string;
    textColor: string;
}

interface AppOrigin {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HomeScreenAppContainerProps {
    Component: ComponentType | null;
    appContainerRef: React.RefObject<HTMLDivElement>;
    isOpening: boolean;
    currentApp: string | null;
    appToOpen: string | null;
    appOpenOrigin: AppOrigin | null;
    statusBarColors: StatusBarColors;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

function HomeScreenAppContainer({
    Component,
    appContainerRef,
    isOpening,
    currentApp,
    appToOpen,
    appOpenOrigin,
    statusBarColors,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: HomeScreenAppContainerProps) {
    if (!((currentApp && Component) || (appToOpen && Component))) {
        return null;
    }

    const transformOrigin = appOpenOrigin
        ? `${appOpenOrigin.x + appOpenOrigin.width / 2}px ${appOpenOrigin.y + appOpenOrigin.height / 2}px`
        : '50% 50%';

    return (
        <div
            ref={appContainerRef}
            className={`ios-app fixed inset-0 z-50 bg-white dark:bg-black overflow-hidden select-none ${
                isOpening ? 'ios-app-opening' : ''
            }`}
            style={{
                transformOrigin,
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Status Bar inside app - always visible */}
            <div className="fixed top-0 left-0 right-0 z-60 pointer-events-none">
                <StatusBar
                    backgroundColor={statusBarColors.backgroundColor}
                    textColor={statusBarColors.textColor}
                />
            </div>
            <div className="w-full h-full relative overflow-hidden pt-safe-top">
                {Component && <Component />}
                {/* iOS Bottom Bar Indicator */}
                <div
                    className="ios-bottom-bar absolute bottom-0 left-0 right-0 flex items-center justify-center safe-area-bottom pointer-events-auto cursor-pointer"
                    style={{
                        height: '44px',
                        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
                        paddingTop: '12px',
                    }}
                >
                    <div
                        className="ios-bottom-bar-handle w-40 h-1.5 rounded-full transition-colors duration-300 pointer-events-none"
                        style={{ backgroundColor: statusBarColors.textColor }}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(HomeScreenAppContainer);
