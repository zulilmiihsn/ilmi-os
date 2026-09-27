'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
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
	/** True for folder slot ids (folders are sortable but never nest). */
	isFolderId: (id: string) => boolean;
	/** Attempt drop-onto-app folder creation. Returns true when a folder was made. */
	onCreateFolder: (draggedAppId: string, targetAppId: string) => boolean;
	/** Attempt moving a loose app into an open target folder. */
	onMoveIntoFolder: (appId: string, folderId: string) => boolean;
	/**
	 * Latest pointer position over the grid, maintained by the owner from its
	 * own pointer handlers (which demonstrably fire during drags). dnd-kit
	 * reports collisions but not pointer coordinates, and this is how a
	 * center drop (folder) is told from an edge drop (reorder).
	 */
	dropPointerRef: { current: { x: number; y: number; t: number } | null };
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
	isFolderId,
	onCreateFolder,
	onMoveIntoFolder,
	dropPointerRef,
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
	// Drop pointer tracking: dnd-kit reports collisions, not pointer
	// coordinates. The listener lives for the whole component lifetime:
	// listeners attached mid-drag demonstrably miss events, while
	// mount-attached ones fire through the whole gesture. Stale points are
	// rejected by timestamp against the drag start.
	const trackDropPoint = useCallback(
		(e: PointerEvent) => {
			dropPointerRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
		},
		[dropPointerRef]
	);

	useEffect(() => {
		window.addEventListener('pointermove', trackDropPoint);
		return () => {
			window.removeEventListener('pointermove', trackDropPoint);
		};
	}, [trackDropPoint]);
	const dragStartTimeRef = useRef(0);
	// Throttle handleDragOver to max 30 updates per second
	const lastDragOverTimeRef = useRef<number>(0);
	const DRAG_OVER_THROTTLE_MS = 33; // ~30fps for state updates
	// Haptic ticks on committed moves, rate-limited so they stay tactile.
	const lastMoveHapticRef = useRef<number>(0);
	const MOVE_HAPTIC_MIN_MS = 150;
	const tickOnSnap = useCallback(() => {
		const now = Date.now();
		if (now - lastMoveHapticRef.current >= MOVE_HAPTIC_MIN_MS) {
			lastMoveHapticRef.current = now;
			triggerHaptic('light');
		}
	}, []);
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

	// Release owned resources if the owner unmounts mid-drag.
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
			dragStartTimeRef.current = Date.now();
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

	const resetRefs = useCallback(() => {
		currentContainerRef.current = null;
		originalContainerRef.current = null;
		originalPosRef.current = -1;
		lastMoveRef.current = '';
		restoreOverflow();
	}, [restoreOverflow]);

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

			// The active item may have been consumed mid-drag (e.g. a folder
			// was just created from it): ignore further events for it.
			const activeKnown =
				page0SetRef.current.has(activeId) ||
				page1SetRef.current.has(activeId) ||
				dockSetRef.current.has(activeId);
			if (!activeKnown) return;

			// O(1) container detection using refs (no callback recreation)
			let targetContainer: 'page0' | 'page1' | 'dock' | null = null;
			if (page0SetRef.current.has(overId)) targetContainer = 'page0';
			else if (page1SetRef.current.has(overId)) targetContainer = 'page1';
			else if (dockSetRef.current.has(overId)) targetContainer = 'dock';

			if (!targetContainer) {
				return;
			}

			const sourceContainer = currentContainerRef.current;
			if (!sourceContainer) return;

			// Folders form on DROP onto an app (like iOS), never on hover-dwell:
			// holding still over an icon must not hijack a slow swap, so there
			// is deliberately no hover timer here. See handleDragEnd.

			// SAME CONTAINER: never reorder here. dnd-kit glides neighbors with
			// transforms computed on the stable array; reordering state instead
			// makes it disable transitions and teleport items. Tick on new
			// targets so the drag still feels tactile.
			if (sourceContainer === targetContainer) {
				const overKey = `${targetContainer}:${overId}`;
				if (lastMoveRef.current !== overKey) {
					lastMoveRef.current = overKey;
					tickOnSnap();
				}
				return;
			}

			// CROSS-CONTAINER: track only; the drop commits. Live-migrating
			// arrays teleports the same way (see above).
			currentContainerRef.current = targetContainer;
			const crossKey = `${targetContainer}:${overId}`;
			if (lastMoveRef.current !== crossKey) {
				lastMoveRef.current = crossKey;
				tickOnSnap();
			}
		},
		[tickOnSnap]
	);

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
			// Accept only a pointer position recorded after this drag
			// started; anything older (or a keyboard-driven drop with no
			// pointer at all) falls back to a plain reorder.
			const tracked = dropPointerRef.current;
			const dropPoint =
				tracked && tracked.t >= dragStartTimeRef.current ? { x: tracked.x, y: tracked.y } : null;

			if (!over) {
				setActiveId(null);
				return;
			}

			const activeId = active.id as string;
			const overId = over.id as string;

			const originalPos = originalPosRef.current;
			const originalContainer = originalContainerRef.current;
			const finalContainer = currentContainerRef.current;

			currentContainerRef.current = null;
			originalContainerRef.current = null;
			originalPosRef.current = -1;
			lastMoveRef.current = '';
			// restoreOverflow() already ran at the top of this handler.

			// Zombie drag (e.g. a folder was created from the active item
			// mid-drag): nothing left to commit.
			const activeKnown =
				page0Items.includes(activeId) ||
				page1Items.includes(activeId) ||
				dockItemIds.includes(activeId);
			if (!activeKnown) {
				setActiveId(null);
				return;
			}

			// Dropping a loose app onto a folder moves it inside.
			if (isFolderId(overId) && !isFolderId(activeId)) {
				if (onMoveIntoFolder(activeId, overId)) {
					for (const setItems of [setPage0Items, setPage1Items, setDockItemIds]) {
						setItems(prev => prev.filter(id => id !== activeId));
					}
				}
				setActiveId(null);
				return;
			}

			// Dropping an app onto another app creates a folder (like iOS) —
			// but only when released near its center. Edge/gap drops reorder
			// to that slot instead, so repositioning stays possible on dense
			// grids. Same page, neither a folder nor an empty slot, not
			// itself; folders never enter the dock so the target is paged.
			const targetEl = document.querySelector(
				`[data-app-id="${overId}"],[data-folder-id="${overId}"]`
			);
			const targetRect = targetEl?.getBoundingClientRect() ?? null;
			const droppedOntoCenter = (() => {
				if (!dropPoint || !targetRect) return false;
				const px = (dropPoint.x - targetRect.left) / targetRect.width;
				const py = (dropPoint.y - targetRect.top) / targetRect.height;
				return px >= 0.25 && px <= 0.75 && py >= 0.25 && py <= 0.75;
			})();
			if (
				droppedOntoCenter &&
				!isFolderId(activeId) &&
				!isFolderId(overId) &&
				!overId.startsWith('empty-') &&
				overId !== activeId &&
				(finalContainer === 'page0' || finalContainer === 'page1')
			) {
				const created = onCreateFolder(activeId, overId);
				console.warn(`[dbg10] center=${droppedOntoCenter} created=${created}`);
				if (created) {
					setActiveId(null);
					return;
				}
				// Creation refused (e.g. dock app dragged in): fall through
				// and reorder to the target slot instead.
			}

			// Folders can be reordered on pages but never enter the dock.
			if (isFolderId(activeId) && finalContainer === 'dock') {
				setActiveId(null);
				return;
			}

			// Resolve the drop target from the live collision. Local arrays
			// stay pristine during drag (see above), so committed coordinates
			// apply: empty slots decode to base+index, real items and folders
			// use their store position.
			let overStorePos: number = -1;
			if (overId === activeId) {
				overStorePos = originalPos;
			} else if (
				finalContainer === 'page0' ||
				finalContainer === 'page1' ||
				finalContainer === 'dock'
			) {
				const emptySlot = /^empty-(\d+)-(\d+)$/.exec(overId);
				if (emptySlot?.[1] !== undefined && emptySlot?.[2] !== undefined) {
					const slotPage = Number(emptySlot[1]);
					const slotIndex = Number(emptySlot[2]);
					overStorePos = slotPage === 0 ? slotIndex : IOS_LAYOUT.PAGE1_BASE + slotIndex;
				} else {
					overStorePos = iosAppPositions[overId] ?? -1;
				}
			}

			if (overStorePos === -1) {
				setActiveId(null);
				return;
			}

			// ENFORCE CONSTRAINTS on final commit. Local counts are committed
			// (never live-mutated), so the incoming/outgoing item is folded in:
			// a dock move-in is refused past 5, a move-out below 4. Reverting
			// is just clearing the drag: arrays already match the store.
			const movingToDock = overStorePos >= IOS_LAYOUT.DOCK_BASE || finalContainer === 'dock';
			const movingFromDock = originalContainer === 'dock';
			const currentDockCount = dockItemIds.length;

			// Max 5: If moving TO dock and wasn't FROM dock
			if (movingToDock && !movingFromDock) {
				if (currentDockCount + 1 > 5) {
					setActiveId(null);
					return;
				}
			}

			// Min 4: If moving FROM dock and not staying in dock
			if (movingFromDock && !movingToDock) {
				if (currentDockCount - 1 < 4) {
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
			iosAppPositions,
			reorderIosApps,
			setActiveId,
			setPage0Items,
			setPage1Items,
			setDockItemIds,
			restoreOverflow,
			isFolderId,
			onMoveIntoFolder,
			onCreateFolder,
			dropPointerRef,
		]
	);

	return {
		handleDragStart,
		handleDragOver,
		handleDragEnd,
		handleDragCancel,
	};
}
