'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWindowsStore } from '../../../stores/windows';
import type { WindowState } from '../../../types';
import { WINDOW } from '../../../constants';

interface DragResizeState {
	isDragging: boolean;
	isResizing: boolean;
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
 * Single Responsibility: all pointer drag/resize math lives here.
 * Window.tsx only consumes isDragging/isResizing + refs.
 */
export function useWindowDragResize(windowState: WindowState): DragResizeState {
	const windowRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);

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
			requestAnimationFrame(() => {
				if (isDragging) {
					const deltaX = e.clientX - interactionRef.current.startX;
					const deltaY = e.clientY - interactionRef.current.startY;
					const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
					const newX = interactionRef.current.initialX + deltaX;
					const newY = Math.max(0, Math.min(vh - 30, interactionRef.current.initialY + deltaY));
					interactionRef.current.currentX = newX;
					interactionRef.current.currentY = newY;
					if (windowRef.current) {
						windowRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
						windowRef.current.style.transition = 'none';
					}
				}
				if (isResizing) {
					const deltaX = e.clientX - interactionRef.current.startX;
					const deltaY = e.clientY - interactionRef.current.startY;
					const newWidth = Math.max(WINDOW.MIN_WIDTH, interactionRef.current.initialWidth + deltaX);
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
		[isDragging, isResizing]
	);

	const handleMouseUp = useCallback(() => {
		if (isDragging) {
			setIsDragging(false);
			useWindowsStore.getState().updateWindow(windowState.id, {
				x: interactionRef.current.currentX,
				y: interactionRef.current.currentY,
			});
		}
		if (isResizing) {
			setIsResizing(false);
			useWindowsStore.getState().updateWindow(windowState.id, {
				width: interactionRef.current.currentWidth,
				height: interactionRef.current.currentHeight,
			});
		}
		if (windowRef.current) windowRef.current.style.transition = '';
	}, [isDragging, isResizing, windowState.id]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (isDragging || isResizing) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

	return {
		isDragging,
		isResizing,
		setIsDragging,
		setIsResizing,
		windowRef,
		interactionRef,
		handleMouseDown,
		handleResizeStart,
	};
}
