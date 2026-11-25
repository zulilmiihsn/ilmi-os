'use client';

import { useDndMonitor } from '@dnd-kit/core';
import { useRef, useEffect } from 'react';

export function DragAutoScroller({
	onChangePage,
}: {
	onChangePage: (dir: 'next' | 'prev') => void;
}) {
	const lastZoneRef = useRef<'none' | 'left' | 'right'>('none');
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const checkZone = (rect: { left: number; width: number } | null) => {
		if (!rect) return 'none';
		const windowWidth = window.innerWidth;

		// Increased to 40px to reduce sensitivity
		// Only triggers when user is clearly trying to move to another page
		const EDGE_ZONE_WIDTH = 40;

		const leftEdge = EDGE_ZONE_WIDTH;
		const rightEdge = windowWidth - EDGE_ZONE_WIDTH;

		const centerX = rect.left + rect.width / 2;

		if (centerX < leftEdge) return 'left';
		if (centerX > rightEdge) return 'right';
		return 'none';
	};

	const clearTimer = () => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	};

	useDndMonitor({
		onDragMove(event) {
			const { active } = event;
			const rect = active?.rect?.current?.translated;
			const currentZone = checkZone(rect);

			if (currentZone !== lastZoneRef.current) {
				// Zone changed
				lastZoneRef.current = currentZone;
				clearTimer();

				if (currentZone !== 'none') {
					// Entered edge zone - start timer
					// Increased to 800ms to prevent accidental triggers
					timerRef.current = setTimeout(() => {
						onChangePage(currentZone === 'left' ? 'prev' : 'next');
						lastZoneRef.current = 'none'; // Allow repeated trigger if user holds
					}, 800);
				}
			}
		},
		onDragEnd() {
			clearTimer();
			lastZoneRef.current = 'none';
		},
		onDragCancel() {
			clearTimer();
			lastZoneRef.current = 'none';
		},
	});

	useEffect(() => clearTimer, []);

	return null;
}
