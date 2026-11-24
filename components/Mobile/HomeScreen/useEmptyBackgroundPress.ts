'use client';

import { useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

// iOS long-press on empty home area enters edit mode; a quick tap on empty
// area leaves it. Icons keep their dnd-kit sensors — this only arms on
// background, so drags, swipes, and icon taps are untouched.
const LONG_PRESS_MS = 500;
const TAP_MS = 350;
const PRESS_TOLERANCE_PX = 12;

interface UseEmptyBackgroundPressProps {
	isEditing: boolean;
	setIsEditing: (editing: boolean) => void;
	isDisabled: boolean;
	dragActiveRef: { current: boolean };
}

export function useEmptyBackgroundPress({
	isEditing,
	setIsEditing,
	isDisabled,
	dragActiveRef,
}: UseEmptyBackgroundPressProps) {
	const emptyPressRef = useRef<{
		x: number;
		y: number;
		time: number;
		moved: boolean;
		timer: ReturnType<typeof setTimeout> | null;
	} | null>(null);

	const clearEmptyPressTimer = useCallback(() => {
		if (emptyPressRef.current?.timer) {
			clearTimeout(emptyPressRef.current.timer);
			emptyPressRef.current.timer = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			if (emptyPressRef.current?.timer) clearTimeout(emptyPressRef.current.timer);
		};
	}, []);

	const isEmptyBackground = useCallback((target: EventTarget | null) => {
		const el = target as HTMLElement | null;
		if (!el || typeof el.closest !== 'function') return false;
		return !el.closest('button, [data-app-id], input, textarea, [role="dialog"]');
	}, []);

	const handleEmptyPressStart = useCallback(
		(e: React.PointerEvent) => {
			if (isDisabled) return;
			if (!isEmptyBackground(e.target)) return;
			clearEmptyPressTimer();
			// In edit mode the press is only tracked so a quick tap can leave;
			// the long-press timer arms solely outside edit mode.
			const rec: {
				x: number;
				y: number;
				time: number;
				moved: boolean;
				timer: ReturnType<typeof setTimeout> | null;
			} = { x: e.clientX, y: e.clientY, time: Date.now(), moved: false, timer: null };
			if (!isEditing) {
				rec.timer = setTimeout(() => {
					emptyPressRef.current = null;
					// A real drag already entered edit mode via dnd-kit; don't double-buzz.
					if (!dragActiveRef.current) {
						setIsEditing(true);
						triggerHaptic('medium');
					}
				}, LONG_PRESS_MS);
			}
			emptyPressRef.current = rec;
		},
		[isEditing, setIsEditing, isDisabled, dragActiveRef, isEmptyBackground, clearEmptyPressTimer]
	);

	const handleEmptyPressMove = useCallback(
		(e: React.PointerEvent) => {
			const rec = emptyPressRef.current;
			if (!rec) return;
			if (
				Math.abs(e.clientX - rec.x) > PRESS_TOLERANCE_PX ||
				Math.abs(e.clientY - rec.y) > PRESS_TOLERANCE_PX
			) {
				rec.moved = true;
				clearEmptyPressTimer();
			}
		},
		[clearEmptyPressTimer]
	);

	const handleEmptyPressEnd = useCallback(() => {
		const rec = emptyPressRef.current;
		emptyPressRef.current = null;
		clearEmptyPressTimer();
		if (rec && !rec.moved && Date.now() - rec.time < TAP_MS && isEditing) {
			setIsEditing(false);
		}
	}, [isEditing, setIsEditing, clearEmptyPressTimer]);

	return {
		handleEmptyPressStart,
		handleEmptyPressMove,
		handleEmptyPressEnd,
	};
}
