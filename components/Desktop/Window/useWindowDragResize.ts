'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWindowsStore } from '../../../stores/windows';
import type { WindowState } from '../../../types';
import { WINDOW } from '../../../constants';
import { computeSnapRect, detectSnapZone, type SnapZone } from '../../../utils/windowSnap';

interface DragResizeState {
	isDragging: boolean;
	isResizing: boolean;
	snapZone: SnapZone | null;
	setIsDragging: (v: boolean) => void;
	setIsResizing: (v: boolean) => void;
	windowRef: React.RefObject<HTMLDivElement>;
	interactionRef: React.MutableRefObject<{
		startX: number;
		startY: number;
		initialX: number;
		initialY: number;
		initialWidth: number;
		initialHeight: number;
		currentX: number;
		currentY: number;
		currentWidth: number;
		currentHeight: number;
		minimizeTarget: { x: number; y: number; width: number; height: number } | null;
	}>;
	handleMouseDown: (e: React.MouseEvent, windowState: WindowState) => void;
	handleResizeStart: (e: React.MouseEvent, windowState: WindowState) => void;
}

/**
 * Single Responsibility: all pointer drag/resize/snap math lives here.
 * Window.tsx only consumes isDragging/isResizing/snapZone + refs.
 */
export function useWindowDragResize(
	windowState: WindowState,
	minWidth: number = WINDOW.MIN_WIDTH
): DragResizeState {
	const windowRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [snapZone, setSnapZone] = useState<SnapZone | null>(null);
	const snapZoneRef = useRef<SnapZone | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const latestPointerRef = useRef<{ x: number; y: number } | null>(null);

	const interactionRef = useRef({
		startX: 0,
		startY: 0,
		initialX: 0,
		initialY: 0,
		initialWidth: 0,
		initialHeight: 0,
		currentX: windowState.x,
		currentY: windowState.y,
		currentWidth: windowState.width,
		currentHeight: windowState.height,
		minimizeTarget: null as { x: number; y: number; width: number; height: number } | null,
	});

	const cancelPendingRaf = useCallback(() => {
		if (rafIdRef.current !== null) {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!isDragging && !isResizing) {
			interactionRef.current.currentX = windowState.x;
			interactionRef.current.currentY = windowState.y;
			interactionRef.current.currentWidth = windowState.width;
			interactionRef.current.currentHeight = windowState.height;
		}
	}, [windowState.x, windowState.y, windowState.width, windowState.height, isDragging, isResizing]);

	function handleMouseDown(e: React.MouseEvent, ws: WindowState) {
		const target = e.target as HTMLElement;
		if (
			(target.classList.contains('window-header') || target.closest('.window-header')) &&
			!ws.isMaximized
		) {
			e.preventDefault();
			snapZoneRef.current = null;
			setSnapZone(null);
			latestPointerRef.current = null;
			setIsDragging(true);
			useWindowsStore.getState().focusWindow(ws.id);
			interactionRef.current.startX = e.clientX;
			interactionRef.current.startY = e.clientY;
			interactionRef.current.initialX = ws.x;
			interactionRef.current.initialY = ws.y;
		}
	}

	function handleResizeStart(e: React.MouseEvent, ws: WindowState) {
		e.preventDefault();
		e.stopPropagation();
		latestPointerRef.current = null;
		setIsResizing(true);
		useWindowsStore.getState().focusWindow(ws.id);
		interactionRef.current.startX = e.clientX;
		interactionRef.current.startY = e.clientY;
		interactionRef.current.initialWidth = ws.width;
		interactionRef.current.initialHeight = ws.height;
	}

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!windowRef.current) return;
			latestPointerRef.current = { x: e.clientX, y: e.clientY };
			if (rafIdRef.current !== null) return;

			rafIdRef.current = requestAnimationFrame(() => {
				rafIdRef.current = null;
				const pointer = latestPointerRef.current;
				if (!pointer) return;

				if (isDragging) {
					const deltaX = pointer.x - interactionRef.current.startX;
					const deltaY = pointer.y - interactionRef.current.startY;
					const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
					const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
					const newX = interactionRef.current.initialX + deltaX;
					const newY = Math.max(28, Math.min(vh - 30, interactionRef.current.initialY + deltaY));
					interactionRef.current.currentX = newX;
					interactionRef.current.currentY = newY;
					if (windowRef.current) {
						windowRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
						windowRef.current.style.transition = 'none';
					}
					const nextZone = detectSnapZone(pointer.x, pointer.y, { width: vw, height: vh });
					if (snapZoneRef.current !== nextZone) {
						snapZoneRef.current = nextZone;
						setSnapZone(nextZone);
					}
				}
				if (isResizing) {
					const deltaX = pointer.x - interactionRef.current.startX;
					const deltaY = pointer.y - interactionRef.current.startY;
					const newWidth = Math.max(minWidth, interactionRef.current.initialWidth + deltaX);
					const newHeight = Math.max(
						WINDOW.MIN_HEIGHT,
						interactionRef.current.initialHeight + deltaY
					);
					interactionRef.current.currentWidth = newWidth;
					interactionRef.current.currentHeight = newHeight;
					if (windowRef.current) {
						windowRef.current.style.width = `${newWidth}px`;
						windowRef.current.style.height = `${newHeight}px`;
						windowRef.current.style.transition = 'none';
					}
				}
			});
		},
		[isDragging, isResizing, minWidth]
	);

	const handleMouseUp = useCallback(() => {
		const hadPendingRaf = rafIdRef.current !== null;
		cancelPendingRaf();

		if (isDragging) {
			setIsDragging(false);
			const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
			const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
			const pointer = latestPointerRef.current;

			if (hadPendingRaf && pointer) {
				const deltaX = pointer.x - interactionRef.current.startX;
				const deltaY = pointer.y - interactionRef.current.startY;
				interactionRef.current.currentX = interactionRef.current.initialX + deltaX;
				interactionRef.current.currentY = Math.max(
					28,
					Math.min(vh - 30, interactionRef.current.initialY + deltaY)
				);
				snapZoneRef.current = detectSnapZone(pointer.x, pointer.y, { width: vw, height: vh });
			}

			const committedZone = snapZoneRef.current;
			snapZoneRef.current = null;
			setSnapZone(null);

			if (committedZone === 'top') {
				if (windowRef.current) {
					windowRef.current.style.transition = '';
					windowRef.current.style.transform = '';
					windowRef.current.style.width = '';
					windowRef.current.style.height = '';
				}
				useWindowsStore.getState().updateWindow(windowState.id, { isMaximized: true });
			} else if (committedZone === 'left' || committedZone === 'right') {
				const rect = computeSnapRect(committedZone, { width: vw, height: vh });
				interactionRef.current.currentX = rect.x;
				interactionRef.current.currentY = rect.y;
				interactionRef.current.currentWidth = rect.width;
				interactionRef.current.currentHeight = rect.height;
				if (windowRef.current) {
					windowRef.current.style.transition = '';
					windowRef.current.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
				}
				useWindowsStore.getState().updateWindow(windowState.id, {
					x: rect.x,
					y: rect.y,
					width: rect.width,
					height: rect.height,
					isMaximized: false,
				});
			} else {
				if (windowRef.current) {
					const el = windowRef.current;
					el.style.transition = 'none';
					el.style.transform = `translate3d(${interactionRef.current.currentX}px, ${interactionRef.current.currentY}px, 0)`;
					// Flush the final pointer position before re-enabling transitions so
					// normal drag release settles immediately without a 250ms glide.
					void el.offsetHeight;
					el.style.transition = '';
				}
				useWindowsStore.getState().updateWindow(windowState.id, {
					x: interactionRef.current.currentX,
					y: interactionRef.current.currentY,
				});
			}
		}
		if (isResizing) {
			setIsResizing(false);
			if (windowRef.current) windowRef.current.style.transition = '';
			useWindowsStore.getState().updateWindow(windowState.id, {
				width: interactionRef.current.currentWidth,
				height: interactionRef.current.currentHeight,
			});
		}
		latestPointerRef.current = null;
	}, [cancelPendingRaf, isDragging, isResizing, windowState.id]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (isDragging || isResizing) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
				cancelPendingRaf();
			};
		}
		return undefined;
	}, [isDragging, isResizing, handleMouseMove, handleMouseUp, cancelPendingRaf]);

	return {
		isDragging,
		isResizing,
		snapZone,
		setIsDragging,
		setIsResizing,
		windowRef,
		interactionRef,
		handleMouseDown,
		handleResizeStart,
	};
}
