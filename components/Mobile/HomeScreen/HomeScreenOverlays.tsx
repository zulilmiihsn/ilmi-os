'use client';

import type { ComponentType } from 'react';
import HomeScreenAppContainer from './HomeScreenAppContainer';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import MobileControlCenter from '../ControlCenter/MobileControlCenter';

interface HomeScreenOverlaysProps {
	Component: ComponentType | null;
	appName: string | undefined;
	appContainerRef: React.RefObject<HTMLDivElement>;
	isOpening: boolean;
	currentApp: string | null;
	appToOpen: string | null;
	appOpenOrigin: { x: number; y: number; width: number; height: number } | null;
	statusBarColors: { backgroundColor: string; textColor: string };
	notificationCenterRef: React.RefObject<HTMLDivElement>;
	controlCenterRef: React.RefObject<HTMLDivElement>;
	isNotificationCenterOpen: boolean;
	isControlCenterOpen: boolean;
	onCloseNotificationCenter: () => void;
	onCloseControlCenter: () => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchMove: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
	onBottomPointerDown: (e: React.PointerEvent) => void;
	onBottomPointerMove: (e: React.PointerEvent) => void;
	onBottomPointerUp: (e: React.PointerEvent) => void;
	onBottomPointerCancel: () => void;
	onCloseApp: () => void;
	onOpenNotificationCenter: () => void;
	onOpenControlCenter: () => void;
	onOpenApp: (appId: string) => void;
}

export default function HomeScreenOverlays({
	Component,
	appName,
	appContainerRef,
	isOpening,
	currentApp,
	appToOpen,
	appOpenOrigin,
	statusBarColors,
	notificationCenterRef,
	controlCenterRef,
	isNotificationCenterOpen,
	isControlCenterOpen,
	onCloseNotificationCenter,
	onCloseControlCenter,
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
	onOpenApp,
}: HomeScreenOverlaysProps) {
	return (
		<>
			<HomeScreenAppContainer
				Component={Component}
				appName={appName}
				appContainerRef={appContainerRef}
				isOpening={isOpening}
				currentApp={currentApp}
				appToOpen={appToOpen}
				appOpenOrigin={appOpenOrigin}
				statusBarColors={statusBarColors}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
				onBottomPointerDown={onBottomPointerDown}
				onBottomPointerMove={onBottomPointerMove}
				onBottomPointerUp={onBottomPointerUp}
				onBottomPointerCancel={onBottomPointerCancel}
				onCloseApp={onCloseApp}
				onOpenNotificationCenter={onOpenNotificationCenter}
				onOpenControlCenter={onOpenControlCenter}
			/>

			{/* iOS Notification Center / Cover Sheet Overlay */}
			<NotificationCenter
				ref={notificationCenterRef}
				isOpen={isNotificationCenterOpen}
				onClose={onCloseNotificationCenter}
				onOpenApp={onOpenApp}
			/>

			{/* iOS Mobile Control Center Overlay */}
			<MobileControlCenter
				ref={controlCenterRef}
				isOpen={isControlCenterOpen}
				onClose={onCloseControlCenter}
				onOpenApp={onOpenApp}
			/>
		</>
	);
}
