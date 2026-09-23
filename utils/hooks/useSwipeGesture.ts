import { useRef, useCallback } from 'react';
import { RESIZE } from '../../constants';

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface UseSwipeGestureOptions {
    /**
     * Minimum distance in px to trigger swipe
     * @default RESIZE.MIN_SWIPE_DISTANCE (50px)
     */
    threshold?: number;
    /**
     * Which directions to detect
     * @default 'both'
     */
    direction?: 'horizontal' | 'vertical' | 'both';
    /**
     * Callback when swipe is detected
     */
    onSwipe: (direction: SwipeDirection, velocity: number, distance: number) => void;
    /**
     * Optional callback during swipe movement
     */
    onSwipeMove?: (deltaX: number, deltaY: number, direction: SwipeDirection | null) => void;
    /**
     * Optional callback when swipe starts
     */
    onSwipeStart?: (x: number, y: number) => void;
    /**
     * Optional callback when swipe ends (regardless of threshold)
     */
    onSwipeEnd?: () => void;
    /**
     * Prevent default behavior during swipe
     * @default false
     */
    preventDefault?: boolean;
}

interface UseSwipeGestureReturn {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Custom hook for handling swipe gestures on touch devices.
 *
 * @example
 * ```tsx
 * const swipeHandlers = useSwipeGesture({
 *   direction: 'vertical',
 *   onSwipe: (dir, velocity) => {
 *     if (dir === 'up') closeApp();
 *   },
 * });
 *
 * return <div {...swipeHandlers}>Swipe me</div>;
 * ```
 */
export function useSwipeGesture({
    threshold = RESIZE.MIN_SWIPE_DISTANCE,
    direction = 'both',
    onSwipe,
    onSwipeMove,
    onSwipeStart,
    onSwipeEnd,
    preventDefault = false,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
    const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const isSwipingRef = useRef(false);

    const getSwipeDirection = useCallback(
        (deltaX: number, deltaY: number): SwipeDirection | null => {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Determine primary direction
            if (direction === 'horizontal' && absY > absX) return null;
            if (direction === 'vertical' && absX > absY) return null;

            if (absX > absY) {
                return deltaX > 0 ? 'right' : 'left';
            } else {
                return deltaY > 0 ? 'down' : 'up';
            }
        },
        [direction]
    );

    const onTouchStart = useCallback(
        (e: React.TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            startRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
            isSwipingRef.current = false;
            onSwipeStart?.(touch.clientX, touch.clientY);
        },
        [onSwipeStart]
    );

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!startRef.current) return;

            const touch = e.touches[0];
            if (!touch) return;
            const deltaX = touch.clientX - startRef.current.x;
            const deltaY = touch.clientY - startRef.current.y;
            const swipeDir = getSwipeDirection(deltaX, deltaY);

            // Mark as swiping if moved enough
            if (!isSwipingRef.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                isSwipingRef.current = true;
            }

            if (preventDefault && isSwipingRef.current && e.cancelable) {
                e.preventDefault();
            }

            onSwipeMove?.(deltaX, deltaY, swipeDir);
        },
        [getSwipeDirection, onSwipeMove, preventDefault]
    );

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (!startRef.current) {
                onSwipeEnd?.();
                return;
            }

            const touch = e.changedTouches[0];
            if (!touch) {
                startRef.current = null;
                isSwipingRef.current = false;
                onSwipeEnd?.();
                return;
            }
            const deltaX = touch.clientX - startRef.current.x;
            const deltaY = touch.clientY - startRef.current.y;
            const deltaTime = Date.now() - startRef.current.time;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const velocity = distance / deltaTime; // px per ms

            const swipeDir = getSwipeDirection(deltaX, deltaY);

            // Check if swipe meets threshold
            const meetsThreshold =
                direction === 'horizontal'
                    ? absX >= threshold
                    : direction === 'vertical'
                        ? absY >= threshold
                        : Math.max(absX, absY) >= threshold;

            if (meetsThreshold && swipeDir) {
                onSwipe(swipeDir, velocity, distance);
            }

            startRef.current = null;
            isSwipingRef.current = false;
            onSwipeEnd?.();
        },
        [direction, threshold, getSwipeDirection, onSwipe, onSwipeEnd]
    );

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
}
