'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { triggerHaptic } from '../../../utils/haptic';
import { IOS_LAYOUT } from '../../../constants';

interface UseDragHandlersProps {
	iosAppPositions: Record<string, number>;
	page0Items: string[];
	page1Items: string[];
	dockItemIds: string[];
	setActiveId: (id: string | null) => void;
	setPage0Items: React.Dispatch<React.SetStateAction<string[]>>;
	setPage1Items: React.Dispatch<React.SetStateAction<string[]>>;
	setDockItemIds: React.Dispatch<React.SetStateAction<string[]>>;
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
}

export function useDragHandlers({
	iosAppPositions,
	page0Items,
	page1Items,
	dockItemIds,
	setActiveId,
	setPage0Items,
	setPage1Items,
	setDockItemIds,
	reorderIosApps,
}: UseDragHandlersProps) {
	// Use refs for Sets to avoid callback recreation
	const page0SetRef = useRef(new Set<string>());
	const page1SetRef = useRef(new Set<string>());
	const dockSetRef = useRef(new Set<string>());

	// Update Sets when arrays change (sync, no re-render)
	useEffect(() => {
		page0SetRef.current = new Set(page0Items);
	}, [page0Items]);

	useEffect(() => {
		page1SetRef.current = new Set(page1Items);
	}, [page1Items]);

	useEffect(() => {
		dockSetRef.current = new Set(dockItemIds);
	}, [dockItemIds]);

	// Track which container the dragged item is CURRENTLY in (via ref, not state)
	const currentContainerRef = useRef<'page0' | 'page1' | 'dock' | null>(null);
	// Track ORIGINAL container (from store) for constraint enforcement
	const originalContainerRef = useRef<'page0' | 'page1' | 'dock' | null>(null);
	// Track original position for store commit
	const originalPosRef = useRef<number>(-1);
	// Debounce cross-container moves to prevent rapid state updates
	const lastMoveRef = useRef<string>('');
	// Throttle handleDragOver to max 30 updates per second
	const lastDragOverTimeRef = useRef<number>(0);
	const DRAG_OVER_THROTTLE_MS = 33; // ~30fps for state updates
	// Body scroll lock is owned by this hook; restore the previous value
	// (not blindly '') on end, cancel, or unmount.
	const prevOverflowRef = useRef<string>('');
	const ownsOverflowRef = useRef(false);

	const restoreOverflow = useCallback(() => {
		if (ownsOverflowRef.current) {
			document.body.style.overflow = prevOverflowRef.current;
			ownsOverflowRef.current = false;
		}
	}, []);

	// Release the scroll lock if the owner unmounts mid-drag.
	useEffect(() => {
		return () => {
			if (ownsOverflowRef.current) {
				document.body.style.overflow = prevOverflowRef.current;
				ownsOverflowRef.current = false;
			}
		};
	}, []);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			const id = event.active.id as string;
			setActiveId(id);
			triggerHaptic('medium');
			prevOverflowRef.current = document.body.style.overflow;
			ownsOverflowRef.current = true;
			document.body.style.overflow = 'hidden';

			// Determine initial container from STORE positions
			const pos = iosAppPositions[id] ?? -1;
			originalPosRef.current = pos;
			lastMoveRef.current = '';

			let container: 'page0' | 'page1' | 'dock' = 'page0';
			if (pos >= IOS_LAYOUT.DOCK_BASE) {
				container = 'dock';
			} else if (pos >= IOS_LAYOUT.PAGE1_BASE) {
				container = 'page1';
			}
			currentContainerRef.current = container;
			originalContainerRef.current = container;
		},
		[iosAppPositions, setActiveId]
	);

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			// Throttle: skip if called too soon after last update
			const now = Date.now();
			if (now - lastDragOverTimeRef.current < DRAG_OVER_THROTTLE_MS) return;
			lastDragOverTimeRef.current = now;

			const activeId = active.id as string;
			const overId = over.id as string;

			// O(1) container detection using refs (no callback recreation)
			let targetContainer: 'page0' | 'page1' | 'dock' | null = null;
			if (page0SetRef.current.has(overId)) targetContainer = 'page0';
			else if (page1SetRef.current.has(overId)) targetContainer = 'page1';
			else if (dockSetRef.current.has(overId)) targetContainer = 'dock';

			if (!targetContainer) return;

			const sourceContainer = currentContainerRef.current;
			if (!sourceContainer) return;

			// SAME CONTAINER: arrayMove for animation
			if (sourceContainer === targetContainer) {
				const items =
					sourceContainer === 'page0'
						? page0Items
						: sourceContainer === 'page1'
							? page1Items
							: dockItemIds;

				const oldIndex = items.indexOf(activeId);
				const newIndex = items.indexOf(overId);

				// Only update if indices are valid and different
				if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
					const setItems =
						sourceContainer === 'page0'
							? setPage0Items
							: sourceContainer === 'page1'
								? setPage1Items
								: setDockItemIds;
					setItems(arrayMove(items, oldIndex, newIndex));
				}
				return;
			}

			// CROSS-CONTAINER: Move item between containers
			// Debounce: only process if this is a new move
			const moveKey = `${sourceContainer}->${targetContainer}`;
			if (lastMoveRef.current === moveKey) return;

			// O(1) check using refs
			const sourceSet =
				sourceContainer === 'page0'
					? page0SetRef.current
					: sourceContainer === 'page1'
						? page1SetRef.current
						: dockSetRef.current;

			if (!sourceSet.has(activeId)) {
				currentContainerRef.current = targetContainer;
				return;
			}

			const targetSet =
				targetContainer === 'page0'
					? page0SetRef.current
					: targetContainer === 'page1'
						? page1SetRef.current
						: dockSetRef.current;

			if (targetSet.has(activeId)) {
				currentContainerRef.current = targetContainer;
				return;
			}

			// Need array for indexOf (to get insert position)
			const targetItems =
				targetContainer === 'page0'
					? page0Items
					: targetContainer === 'page1'
						? page1Items
						: dockItemIds;
			const targetIndex = targetItems.indexOf(overId);

			// Mark this move
			lastMoveRef.current = moveKey;

			// Perform the move
			if (sourceContainer === 'page0') {
				setPage0Items(prev => prev.filter(id => id !== activeId));
			} else if (sourceContainer === 'page1') {
				setPage1Items(prev => prev.filter(id => id !== activeId));
			} else if (sourceContainer === 'dock') {
				setDockItemIds(prev => prev.filter(id => id !== activeId));
			}

			if (targetContainer === 'page0') {
				setPage0Items(prev => {
					const newItems = [...prev];
					newItems.splice(targetIndex >= 0 ? targetIndex : newItems.length, 0, activeId);
					return newItems;
				});
			} else if (targetContainer === 'page1') {
				setPage1Items(prev => {
					const newItems = [...prev];
					newItems.splice(targetIndex >= 0 ? targetIndex : newItems.length, 0, activeId);
					return newItems;
				});
			} else if (targetContainer === 'dock') {
				setDockItemIds(prev => {
					const newItems = [...prev];
					newItems.splice(targetIndex >= 0 ? targetIndex : newItems.length, 0, activeId);
					return newItems;
				});
			}

			// Update ref to new container and reset debounce
			currentContainerRef.current = targetContainer;
			lastMoveRef.current = '';
		},
		[page0Items, page1Items, dockItemIds, setPage0Items, setPage1Items, setDockItemIds]
	);

	const resetRefs = useCallback(() => {
		currentContainerRef.current = null;
		originalContainerRef.current = null;
		originalPosRef.current = -1;
		lastMoveRef.current = '';
		restoreOverflow();
	}, [restoreOverflow]);

	const handleDragCancel = useCallback(() => {
		// Cancellation discards the provisional layout: clearing activeId lets
		// HomeScreen resync its local arrays from committed store positions.
		resetRefs();
		setActiveId(null);
	}, [resetRefs, setActiveId]);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			restoreOverflow();

			const originalPos = originalPosRef.current;
			const originalContainer = originalContainerRef.current;
			const finalContainer = currentContainerRef.current;

			currentContainerRef.current = null;
			originalContainerRef.current = null;
			originalPosRef.current = -1;
			lastMoveRef.current = '';
			// restoreOverflow() already ran at the top of this handler.

			if (!over) {
				setActiveId(null);
				return;
			}

			// Calculate NEW absolute position based on where the item ended up in the local state
			let overStorePos: number = -1;
			const activeId = active.id as string;

			if (finalContainer === 'page0') {
				const index = page0Items.indexOf(activeId);
				if (index !== -1) overStorePos = index;
			} else if (finalContainer === 'page1') {
				const index = page1Items.indexOf(activeId);
				if (index !== -1) overStorePos = IOS_LAYOUT.PAGE1_BASE + index;
			} else if (finalContainer === 'dock') {
				const index = dockItemIds.indexOf(activeId);
				if (index !== -1) overStorePos = IOS_LAYOUT.DOCK_BASE + index;
			}

			if (overStorePos === -1) {
				setActiveId(null);
				return;
			}

			// ENFORCE CONSTRAINTS on final commit
			const movingToDock = overStorePos >= IOS_LAYOUT.DOCK_BASE || finalContainer === 'dock';
			const movingFromDock = originalContainer === 'dock';
			const currentDockCount = dockItemIds.length;

			// Helper function to revert item to original container
			const revertToOriginal = () => {
				const activeId = active.id as string;

				// Remove from current container
				if (finalContainer === 'page0') {
					setPage0Items(prev => prev.filter(id => id !== activeId));
				} else if (finalContainer === 'page1') {
					setPage1Items(prev => prev.filter(id => id !== activeId));
				} else if (finalContainer === 'dock') {
					setDockItemIds(prev => prev.filter(id => id !== activeId));
				}

				// Add back to original container at original position
				if (originalContainer === 'page0') {
					setPage0Items(prev => {
						if (prev.includes(activeId)) return prev;
						const newItems = [...prev];
						const insertPos = Math.min(originalPos, newItems.length);
						newItems.splice(insertPos, 0, activeId);
						return newItems;
					});
				} else if (originalContainer === 'page1') {
					setPage1Items(prev => {
						if (prev.includes(activeId)) return prev;
						const newItems = [...prev];
						const insertPos = Math.min(originalPos - IOS_LAYOUT.PAGE1_BASE, newItems.length);
						newItems.splice(insertPos, 0, activeId);
						return newItems;
					});
				} else if (originalContainer === 'dock') {
					setDockItemIds(prev => {
						if (prev.includes(activeId)) return prev;
						const newItems = [...prev];
						const insertPos = Math.min(originalPos - IOS_LAYOUT.DOCK_BASE, newItems.length);
						newItems.splice(insertPos, 0, activeId);
						return newItems;
					});
				}
			};

			// Max 5: If moving TO dock and wasn't FROM dock
			if (movingToDock && !movingFromDock) {
				if (currentDockCount > 5) {
					revertToOriginal();
					setActiveId(null);
					return;
				}
			}

			// Min 4: If moving FROM dock and not staying in dock
			if (movingFromDock && !movingToDock) {
				if (currentDockCount < 4) {
					revertToOriginal();
					setActiveId(null);
					return;
				}
			}

			// Commit to store
			reorderIosApps(originalPos, overStorePos);

			// Set activeId null AFTER commit so useEffect syncs from updated store
			setActiveId(null);
		},
		[
			page0Items,
			page1Items,
			dockItemIds,
			reorderIosApps,
			setActiveId,
			setPage0Items,
			setPage1Items,
			setDockItemIds,
			restoreOverflow,
		]
	);

	return {
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		handleDragCancel,
	};
}
