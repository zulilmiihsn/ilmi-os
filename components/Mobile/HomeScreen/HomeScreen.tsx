'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	KeyboardSensor,
	useSensor,
	useSensors,
	TouchSensor,
	MouseSensor,
	MeasuringStrategy,
	CollisionDetection,
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
} from '@dnd-kit/sortable';

import { ErrorBoundary } from '../../ErrorBoundary';
import StatusBar from '../StatusBar';
import AppIcon from '../AppIcon';
import SortableAppIcon from './SortableAppIcon';
import Widget from '../Widget';
import { useAppsStore } from '../../../stores/apps';
import { useSettingsStore } from '../../../stores/settings';
import { getAppComponent } from '../../../utils/appComponents';
import { triggerHaptic } from '../../../utils/haptic';
import HomeScreenDock from './HomeScreenDock';
import HomeScreenAppContainer from './HomeScreenAppContainer';
import { DragAutoScroller } from './DragAutoScroller';
import { useDragHandlers } from './useDragHandlers';
import { useHomeScreenGestures } from './useHomeScreenGestures';

// Helper to generate empty slot IDs
const getEmptySlotId = (page: number, index: number) => `empty-${page}-${index}`;

// Helper to generate page items (pure function, no hooks)
const computePageItems = (pageIndex: number, positions: Map<string, number>, appsList: { id: string }[]) => {
	const items: string[] = [];
	const PAGE_SIZE = pageIndex === 0 ? 24 : 28;
	const offset = pageIndex === 0 ? 0 : 24 + (pageIndex - 1) * 28;

	for (let i = 0; i < PAGE_SIZE; i++) {
		const absoluteIndex = offset + i;
		const app = appsList.find(a => positions.get(a.id) === absoluteIndex);
		items.push(app ? app.id : getEmptySlotId(pageIndex, i));
	}
	return items;
};

// Helper to compute dock items
const computeDockItems = (positions: Map<string, number>) => {
	const dock: { id: string; pos: number }[] = [];
	positions.forEach((pos, id) => {
		if (pos >= 100) dock.push({ id, pos });
	});
	dock.sort((a, b) => a.pos - b.pos);
	return dock.map(d => d.id);
};

function HomeScreen() {
	const allApps = useAppsStore(state => state.apps);
	const { wallpaper, darkMode } = useSettingsStore();

	const iosAppPositions = useAppsStore(state => state.iosAppPositions);
	const launchApp = useAppsStore(state => state.launchApp);
	const closeApp = useAppsStore(state => state.closeApp);
	const reorderIosApps = useAppsStore(state => state.reorderIosApps);

	const apps = useMemo(
		() => allApps.filter(app => app.platform === 'ios' || app.platform === 'both'),
		[allApps]
	);

	// O(1) lookup map for render functions only (doesn't affect state sync)
	const appsMap = useMemo(() => new Map(apps.map(app => [app.id, app])), [apps]);

	// --- DND State ---
	const [activeId, setActiveId] = useState<string | null>(null);
	const isDragging = activeId !== null;

	// Lazy initial state (computed once on mount)
	const [page0Items, setPage0Items] = useState<string[]>(() => computePageItems(0, iosAppPositions, apps));
	const [page1Items, setPage1Items] = useState<string[]>(() => computePageItems(1, iosAppPositions, apps));
	const [dockItemIds, setDockItemIds] = useState<string[]>(() => computeDockItems(iosAppPositions));

	// Refs to avoid stale closures and prevent infinite loops
	const appsRef = useRef(apps);
	appsRef.current = apps; // Always keep current

	// Sync only when store POSITIONS change AND not dragging
	useEffect(() => {
		// Skip if dragging
		if (isDragging) return;

		// Use ref for apps to avoid it being a dependency
		const currentApps = appsRef.current;
		const newPage0 = computePageItems(0, iosAppPositions, currentApps);
		const newPage1 = computePageItems(1, iosAppPositions, currentApps);
		const newDock = computeDockItems(iosAppPositions);

		setPage0Items(prev => JSON.stringify(prev) === JSON.stringify(newPage0) ? prev : newPage0);
		setPage1Items(prev => JSON.stringify(prev) === JSON.stringify(newPage1) ? prev : newPage1);
		setDockItemIds(prev => JSON.stringify(prev) === JSON.stringify(newDock) ? prev : newDock);
	}, [iosAppPositions, isDragging]); // Removed apps from dependencies

	// --- Sensors ---
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			// Delay 250ms mimics Long Press. Quick swipes are ignored by drag.
			activationConstraint: { delay: 250, tolerance: 15 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// --- App / Swipe State ---
	// --- App / Swipe State ---
	const [currentApp, setCurrentApp] = useState<string | null>(null);
	const [appToOpen, setAppToOpen] = useState<string | null>(null);
	const appContainerRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);

	// --- App / Swipe State Handled by Custom Hook ---
	const {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	} = useHomeScreenGestures({
		isDragging,
		currentApp,
		appToOpen,
		currentPage,
		setCurrentPage,
		closeApp,
		setCurrentApp,
		appContainerRef,
	});


	// --- App State ---
	const [isOpening, setIsOpening] = useState(false);
	const [appOpenOrigin, setAppOpenOrigin] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const currentPageRef = useRef(0);
	useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

	// Drag handlers with cross-container support
	const { handleDragStart, handleDragOver, handleDragEnd } = useDragHandlers({
		iosAppPositions,
		page0Items,
		page1Items,
		dockItemIds,
		setActiveId,
		setPage0Items,
		setPage1Items,
		setDockItemIds,
		reorderIosApps,
	});

	const statusBarColors = useMemo(() => {

		const appId = currentApp || appToOpen;
		if (!appId) return { backgroundColor: 'transparent', textColor: 'white' };
		const isDark = darkMode;
		if (appId === 'terminal') return { backgroundColor: '#000000', textColor: '#ffffff' };
		return {
			backgroundColor: isDark ? '#000000' : '#ffffff',
			textColor: isDark ? '#ffffff' : '#000000',
		};
	}, [currentApp, appToOpen, darkMode]);

	// --- Handlers ---
	const pageAwareCollisionDetection = useCallback<CollisionDetection>((args) => {
		const { droppableContainers, ...rest } = args;
		const validPageIds = currentPage === 0 ? page0Items : page1Items;
		const allValidIds = [...validPageIds, ...dockItemIds];
		const filteredContainers = droppableContainers.filter(container => {
			return allValidIds.includes(container.id as string);
		});

		return closestCenter({
			...rest,
			droppableContainers: filteredContainers
		});
	}, [page0Items, page1Items, dockItemIds, currentPage]);

	const handleAppClick = useCallback((appId: string) => {
		if (isDragging) return;

		triggerHaptic('light');

		const iconElement = document.querySelector(`[data-app-id="${appId}"]`) as HTMLElement;
		if (iconElement) {
			const rect = iconElement.getBoundingClientRect();
			setAppOpenOrigin({
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			});
		} else {
			setAppOpenOrigin(null);
		}

		setAppToOpen(appId);
		setIsOpening(true);

		setTimeout(() => {
			launchApp(appId);
			setCurrentApp(appId);
			setAppToOpen(null);
			setIsOpening(false);
		}, 340);
	}, [isDragging, launchApp]);

	// --- Render Helpers ---
	const renderGridItem = (id: string, _index: number) => {
		const isApp = !id.startsWith('empty-');
		if (isApp) {
			const app = appsMap.get(id);
			if (!app) return null;
			return <SortableAppIcon key={id} id={id} app={app} onClick={handleAppClick} />;
		} else {
			// ENABLE empty slots as drop targets (remove disabled=true).
			// They are not draggable because we don't attach listeners in SortableAppIcon if isEmpty=true.
			return <SortableAppIcon key={id} id={id} app={{ id, name: '', icon: '', platform: 'ios', component: 'none' }} onClick={() => { }} isEmpty={true} />;
		}
	};

	const renderOverlayItem = (id: string) => {
		const app = appsMap.get(id);
		if (!app) return null;
		return (
			<div className="w-16 h-16 pointer-events-none">
				{/* Pass isDragging=false to AppIcon so it renders fully opaque without the 'ios-dragging' styles that might reduce opacity.
				    The opacity/ghosting of the *original* item is handled by SortableAppIcon. 
					The *dragged* copy (overlay) should be clear and solid. */}
				<AppIcon
					app={app}
					isDragging={false}
				/>
			</div>
		);
	};

	const Component = useMemo(() => {
		const appId = currentApp || appToOpen;
		if (!appId) return null;
		const app = useAppsStore.getState().getAppById(appId);
		if (!app?.component) return null;
		return getAppComponent(app.component);
	}, [currentApp, appToOpen]);

	const dockApps = useMemo(() => {
		return dockItemIds.map(id => apps.find(a => a.id === id)!).filter(Boolean);
	}, [apps, dockItemIds]);

	return (
		<ErrorBoundary>
			<div className="ios-homescreen w-screen h-screen overflow-hidden relative touch-pan-x"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Wallpaper */}
				<div key={wallpaper} className="wallpaper absolute inset-0 -z-10">
					{wallpaper.startsWith('/') || wallpaper.startsWith('http') ? (
						<Image src={wallpaper} alt="Wallpaper" fill className="object-cover" priority unoptimized />
					) : (
						<div className="w-full h-full" style={{ background: wallpaper }}></div>
					)}
				</div>

				{!currentApp && !appToOpen && <StatusBar backgroundColor="transparent" textColor="white" />}

				<DndContext
					sensors={sensors}
					collisionDetection={pageAwareCollisionDetection}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
					measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
				>
					{/* Drag Monitor for Auto-Scroll */}
					<DragAutoScroller
						onChangePage={(dir: 'next' | 'prev') => {
							if (dir === 'next' && currentPage < 1) setCurrentPage(1);
							if (dir === 'prev' && currentPage > 0) setCurrentPage(0);
						}}
					/>

					<div className="absolute inset-0 pt-12 pb-32 overflow-hidden">
						<div
							className="flex h-full w-[200vw]"
							style={{
								transform: `translateX(-${currentPage * 100}vw)`,
								transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
							}}
						>
							{/* Page 0 */}
							<div className="ios-app-grid-page w-screen h-full px-4">
								<SortableContext items={page0Items} strategy={rectSortingStrategy}>
									<div className="grid grid-cols-4 gap-5">
										<div className="col-span-2 row-span-2 pointer-events-none">
											<Widget type="battery" />
										</div>
										{page0Items.map((id, index) => (
											<div key={id} className="w-full aspect-square">
												{renderGridItem(id, index)}
											</div>
										))}
									</div>
								</SortableContext>
							</div>

							{/* Page 1 */}
							<div className="ios-app-grid-page w-screen h-full px-4">
								<SortableContext items={page1Items} strategy={rectSortingStrategy}>
									<div className="grid grid-cols-4 gap-5">
										{page1Items.map((id, index) => (
											<div key={id} className="w-full aspect-square">
												{renderGridItem(id, index)}
											</div>
										))}
									</div>
								</SortableContext>
							</div>
						</div>
					</div>

					<DragOverlay>
						{activeId ? renderOverlayItem(activeId) : null}
					</DragOverlay>

					<HomeScreenDock apps={dockApps} onAppClick={handleAppClick} />
				</DndContext>

			</div>

			<HomeScreenAppContainer
				Component={Component}
				appContainerRef={appContainerRef}
				isOpening={isOpening}
				currentApp={currentApp}
				appToOpen={appToOpen}
				appOpenOrigin={appOpenOrigin}
				statusBarColors={statusBarColors}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			/>
		</ErrorBoundary>
	);
}



export default HomeScreen;

