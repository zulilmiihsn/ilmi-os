'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';

import { ErrorBoundary } from '../../ErrorBoundary';
import { useAppsStore } from '../../../stores/apps';
import { isIosApp } from '../../../types';
import { useSettingsStore } from '../../../stores/settings';
import { getAppComponent } from '../../../utils/appComponents';
import { triggerHaptic } from '../../../utils/haptic';
import HomeScreenDock from './HomeScreenDock';
import HomeScreenPagination from './HomeScreenPagination';
import HomeScreenPages, { DragOverlayAppIcon } from './HomeScreenPages';
import HomeScreenOverlays from './HomeScreenOverlays';
import HomeScreenHeader from './HomeScreenHeader';
import { DragAutoScroller } from './DragAutoScroller';
import { useHomeScreenGestures } from './useHomeScreenGestures';
import { useEmptyBackgroundPress } from './useEmptyBackgroundPress';
import { useAppLauncher } from './useAppLauncher';
import { useHomeScreenDnd } from './useHomeScreenDnd';
import { computeDockItems, computePageItems, getStatusBarColors } from './homeScreenLayout';

function HomeScreen() {
	const allApps = useAppsStore(state => state.apps);
	const { wallpaper, darkMode } = useSettingsStore();

	const iosAppPositions = useAppsStore(state => state.iosAppPositions);
	const launchApp = useAppsStore(state => state.launchApp);
	const closeApp = useAppsStore(state => state.closeApp);
	const reorderIosApps = useAppsStore(state => state.reorderIosApps);

	const apps = useMemo(() => allApps.filter(isIosApp), [allApps]);

	// O(1) lookup map for render functions only (doesn't affect state sync)
	const appsMap = useMemo(() => new Map(apps.map(app => [app.id, app])), [apps]);

	// iOS-style edit (jiggle) mode: entered on drag start, left via Done,
	// home indicator, app launch, or Escape.
	const [isEditing, setIsEditing] = useState(false);

	// Derive the committed order in the drop's render. Syncing a second copy
	// in an effect lets dnd-kit clear its transforms against the old order,
	// making neighbours jump back before the new order is rendered.
	const page0Items = useMemo(
		() => computePageItems(0, iosAppPositions, apps),
		[iosAppPositions, apps]
	);
	const page1Items = useMemo(
		() => computePageItems(1, iosAppPositions, apps),
		[iosAppPositions, apps]
	);
	const dockItemIds = useMemo(() => computeDockItems(iosAppPositions), [iosAppPositions]);

	const appContainerRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);

	const {
		activeId,
		isDragging,
		dragActiveRef,
		sensors,
		pageAwareCollisionDetection,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		handleDragCancel,
	} = useHomeScreenDnd({
		iosAppPositions,
		page0Items,
		page1Items,
		dockItemIds,
		currentPage,
		reorderIosApps,
		setIsEditing,
	});

	// Notification Center & Control Center panels
	const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
	const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
	const notificationCenterRef = useRef<HTMLDivElement>(null);
	const controlCenterRef = useRef<HTMLDivElement>(null);

	const handleOpenNotificationCenter = useCallback(() => {
		triggerHaptic('light');
		setIsNotificationCenterOpen(true);
		setIsControlCenterOpen(false);
	}, []);

	const handleOpenControlCenter = useCallback(() => {
		triggerHaptic('light');
		setIsControlCenterOpen(true);
		setIsNotificationCenterOpen(false);
	}, []);

	const cancelPendingCloseRef = useRef<() => void>(() => {});
	const { currentApp, setCurrentApp, appToOpen, isOpening, appOpenOrigin, handleAppClick } =
		useAppLauncher({
			isDragging,
			launchApp,
			setIsEditing,
			cancelPendingCloseRef,
		});

	const handleCloseApp = useCallback(() => {
		if (currentApp) closeApp(currentApp);
	}, [closeApp, currentApp]);

	const {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleTouchCancel,
		handleBottomPointerDown,
		handleBottomPointerMove,
		handleBottomPointerUp,
		handleBottomPointerCancel,
		triggerCloseApp,
		cancelPendingClose,
	} = useHomeScreenGestures({
		isDragging,
		isDraggingRef: dragActiveRef,
		currentApp,
		appToOpen,
		currentPage,
		setCurrentPage,
		closeApp: handleCloseApp,
		setCurrentApp,
		appContainerRef,
		notificationCenterRef,
		controlCenterRef,
		setIsNotificationCenterOpen,
		setIsControlCenterOpen,
		onOpenNotificationCenter: handleOpenNotificationCenter,
		onOpenControlCenter: handleOpenControlCenter,
	});
	cancelPendingCloseRef.current = cancelPendingClose;

	const exitEditing = useCallback(() => setIsEditing(false), []);

	const { handleEmptyPressStart, handleEmptyPressMove, handleEmptyPressEnd } =
		useEmptyBackgroundPress({
			isEditing,
			setIsEditing,
			isDisabled: Boolean(
				currentApp || appToOpen || isNotificationCenterOpen || isControlCenterOpen
			),
			dragActiveRef,
		});

	// Home indicator: closes the open app, or leaves edit mode when idle.
	const handleHomeIndicator = useCallback(() => {
		if (currentApp || appToOpen) {
			triggerCloseApp();
		} else {
			setIsEditing(false);
		}
	}, [currentApp, appToOpen, triggerCloseApp]);

	// Escape leaves edit mode (dnd-kit already cancels an active drag).
	useEffect(() => {
		if (!isEditing) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setIsEditing(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isEditing]);

	const statusBarColors = useMemo(
		() => getStatusBarColors(currentApp || appToOpen, darkMode),
		[currentApp, appToOpen, darkMode]
	);

	const Component = useMemo(() => {
		const appId = currentApp || appToOpen;
		if (!appId) return null;
		const app = useAppsStore.getState().getAppById(appId);
		if (!app?.component) return null;
		return getAppComponent(app.component);
	}, [currentApp, appToOpen]);

	const dockApps = useMemo(() => {
		return dockItemIds
			.map(id => appsMap.get(id))
			.filter((a): a is NonNullable<typeof a> => Boolean(a));
	}, [appsMap, dockItemIds]);

	const activeApp = activeId ? appsMap.get(activeId) : undefined;

	return (
		<ErrorBoundary>
			<div
				className="ios-homescreen w-screen h-[100dvh] overflow-hidden relative touch-pan-x"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onTouchCancel={handleTouchCancel}
			>
				<HomeScreenHeader
					wallpaper={wallpaper}
					isAppOpen={Boolean(currentApp || appToOpen)}
					isEditing={isEditing}
					onExitEditing={exitEditing}
					onOpenNotificationCenter={handleOpenNotificationCenter}
					onOpenControlCenter={handleOpenControlCenter}
				/>

				<DndContext
					sensors={sensors}
					collisionDetection={pageAwareCollisionDetection}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}
					measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
				>
					<DragAutoScroller
						onChangePage={(dir: 'next' | 'prev') => {
							if (dir === 'next' && currentPage < 1) setCurrentPage(1);
							if (dir === 'prev' && currentPage > 0) setCurrentPage(0);
						}}
					/>

					<HomeScreenPages
						isEditing={isEditing}
						currentPage={currentPage}
						page0Items={page0Items}
						page1Items={page1Items}
						appsMap={appsMap}
						onAppClick={handleAppClick}
						onEmptyPressStart={handleEmptyPressStart}
						onEmptyPressMove={handleEmptyPressMove}
						onEmptyPressEnd={handleEmptyPressEnd}
					/>

					<HomeScreenPagination
						currentPage={currentPage}
						totalPages={2}
						visible={!currentApp && !appToOpen}
						onPageChange={setCurrentPage}
					/>

					<DragOverlay>{activeApp ? <DragOverlayAppIcon app={activeApp} /> : null}</DragOverlay>

					<HomeScreenDock apps={dockApps} onAppClick={handleAppClick} isEditing={isEditing} />
				</DndContext>
			</div>

			<HomeScreenOverlays
				Component={Component}
				appName={
					currentApp || appToOpen
						? (appsMap.get(currentApp || appToOpen || '')?.name ?? undefined)
						: undefined
				}
				appContainerRef={appContainerRef}
				isOpening={isOpening}
				currentApp={currentApp}
				appToOpen={appToOpen}
				appOpenOrigin={appOpenOrigin}
				statusBarColors={statusBarColors}
				notificationCenterRef={notificationCenterRef}
				controlCenterRef={controlCenterRef}
				isNotificationCenterOpen={isNotificationCenterOpen}
				isControlCenterOpen={isControlCenterOpen}
				onCloseNotificationCenter={() => setIsNotificationCenterOpen(false)}
				onCloseControlCenter={() => setIsControlCenterOpen(false)}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onBottomPointerDown={handleBottomPointerDown}
				onBottomPointerMove={handleBottomPointerMove}
				onBottomPointerUp={handleBottomPointerUp}
				onBottomPointerCancel={handleBottomPointerCancel}
				onCloseApp={handleHomeIndicator}
				onOpenNotificationCenter={handleOpenNotificationCenter}
				onOpenControlCenter={handleOpenControlCenter}
				onOpenApp={handleAppClick}
			/>
		</ErrorBoundary>
	);
}

export default HomeScreen;
