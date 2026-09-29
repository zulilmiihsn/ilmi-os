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
	reorderIosApps: (fromIndex: number, toIndex: number) => void;
}

export function useDragHandlers({
	iosAppPositions,
	page0Items,
	page1Items,
	dockItemIds,
	setActiveId,
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

			// Ignore events for items no longer present in the layout.
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
		// The store order never changed; dnd-kit clears the preview transforms.
		resetRefs();
		setActiveId(null);
	}, [resetRefs, setActiveId]);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			restoreOverflow();

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

			// Ignore a drag whose active item is no longer in the layout.
			const activeKnown =
				page0Items.includes(activeId) ||
				page1Items.includes(activeId) ||
				dockItemIds.includes(activeId);
			if (!activeKnown) {
				setActiveId(null);
				return;
			}

			// Resolve the drop target from the live collision. Local arrays
			// stay pristine during drag (see above), so committed coordinates
			// apply: empty slots decode to base+index, real items
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

			// Clear the overlay together with the committed order.
			setActiveId(null);
		},
		[
			page0Items,
			page1Items,
			dockItemIds,
			iosAppPositions,
			reorderIosApps,
			setActiveId,
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
