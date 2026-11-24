'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import {
	KeyboardSensor,
	useSensor,
	useSensors,
	TouchSensor,
	MouseSensor,
	type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDragHandlers } from './useDragHandlers';
import { createPageAwareCollisionDetection } from './homeScreenLayout';

interface UseHomeScreenDndProps {
	iosAppPositions: Record<string, number>;
	page0Items: string[];
	page1Items: string[];
	dockItemIds: string[];
	currentPage: number;
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
	setIsEditing: (editing: boolean) => void;
}

export function useHomeScreenDnd({
	iosAppPositions,
	page0Items,
	page1Items,
	dockItemIds,
	currentPage,
	reorderIosApps,
	setIsEditing,
}: UseHomeScreenDndProps) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const isDragging = activeId !== null;
	// Synchronous mirror of drag activity. React state updates async, so a
	// touchend arriving right after drop could otherwise read a stale
	// isDragging=false and misfire a page swipe.
	const dragActiveRef = useRef(false);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			// Short hold before a touch becomes a drag: page swipes stay
			// snappy and icon-origin touches never flip pages (see gestures).
			activationConstraint: { delay: 120, tolerance: 15 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const {
		handleDragStart: handleDragStartInner,
		handleDragOver,
		handleDragEnd: handleDragEndInner,
		handleDragCancel: handleDragCancelInner,
	} = useDragHandlers({
		iosAppPositions,
		page0Items,
		page1Items,
		dockItemIds,
		setActiveId,
		reorderIosApps,
	});

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			dragActiveRef.current = true;
			setIsEditing(true);
			handleDragStartInner(event);
		},
		[handleDragStartInner, setIsEditing]
	);

	const handleDragEnd = useCallback(
		(event: Parameters<typeof handleDragEndInner>[0]) => {
			dragActiveRef.current = false;
			handleDragEndInner(event);
		},
		[handleDragEndInner]
	);

	const handleDragCancel = useCallback(() => {
		dragActiveRef.current = false;
		handleDragCancelInner();
	}, [handleDragCancelInner]);

	const pageAwareCollisionDetection = useMemo(
		() =>
			createPageAwareCollisionDetection(currentPage === 0 ? page0Items : page1Items, dockItemIds),
		[page0Items, page1Items, dockItemIds, currentPage]
	);

	return {
		activeId,
		isDragging,
		dragActiveRef,
		sensors,
		pageAwareCollisionDetection,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		handleDragCancel,
	};
}
