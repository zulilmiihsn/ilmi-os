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
	appName?: string;
	appContainerRef: React.RefObject<HTMLDivElement>;
	isOpening: boolean;
	currentApp: string | null;
	appToOpen: string | null;
	appOpenOrigin: AppOrigin | null;
	statusBarColors: StatusBarColors;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchMove: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
	onBottomPointerDown?: (e: React.PointerEvent) => void;
	onBottomPointerMove?: (e: React.PointerEvent) => void;
	onBottomPointerUp?: (e: React.PointerEvent) => void;
	onBottomPointerCancel?: (e: React.PointerEvent) => void;
	onCloseApp?: () => void;
	onOpenNotificationCenter?: () => void;
	onOpenControlCenter?: () => void;
}

function HomeScreenAppContainer({
	Component,
	appName,
	appContainerRef,
	isOpening,
	currentApp,
	appToOpen,
	appOpenOrigin,
	statusBarColors,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	onBottomPointerDown,
	onBottomPointerMove,
	onBottomPointerUp,
	onBottomPointerCancel,
	onCloseApp,
	onOpenNotificationCenter,
	onOpenControlCenter,
}: HomeScreenAppContainerProps) {
	if (!currentApp && !appToOpen) {
		return null;
	}

	const transformOrigin = appOpenOrigin
		? `${appOpenOrigin.x + appOpenOrigin.width / 2}px ${appOpenOrigin.y + appOpenOrigin.height / 2}px`
		: '50% 50%';

	return (
		<div
			key={currentApp || appToOpen || 'app-container'}
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
			{/* Status Bar inside app - interactive trigger zones */}
			<div className="fixed top-0 left-0 right-0 z-60">
				<StatusBar
					backgroundColor={statusBarColors.backgroundColor}
					textColor={statusBarColors.textColor}
					onOpenNotificationCenter={onOpenNotificationCenter}
					onOpenControlCenter={onOpenControlCenter}
				/>
			</div>

			{/* App Content */}
			<div className="w-full h-full relative overflow-hidden pt-safe-top">
				{Component ? (
					<Component />
				) : (
					<div className="p-4 flex items-center justify-center h-full text-gray-400">
						<div className="text-center">
							<p className="font-medium">App: {appName ?? currentApp ?? appToOpen}</p>
							<p className="text-sm">Under Development</p>
						</div>
					</div>
				)}
			</div>

			{/* iOS Bottom Bar Indicator - floating on top of all child content with high hit area and pointer capture */}
			<div
				className="ios-bottom-bar fixed bottom-0 left-0 right-0 z-70 flex items-center justify-center cursor-pointer touch-none select-none"
				style={{
					height: '56px',
					paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
					paddingTop: '8px',
				}}
				role="button"
				tabIndex={0}
				aria-label="Close app and return to home screen"
				onPointerDown={onBottomPointerDown}
				onPointerMove={onBottomPointerMove}
				onPointerUp={onBottomPointerUp}
				onPointerCancel={onBottomPointerCancel}
				onClick={onCloseApp}
				onKeyDown={e => {
					if ((e.key === 'Enter' || e.key === ' ') && onCloseApp) {
						e.preventDefault();
						onCloseApp();
					}
				}}
			>
				<div
					className="ios-bottom-bar-handle w-36 h-1.5 rounded-full transition-colors duration-300 pointer-events-none"
					style={{ backgroundColor: statusBarColors.textColor }}
				/>
			</div>
		</div>
	);
}

export default memo(HomeScreenAppContainer);
