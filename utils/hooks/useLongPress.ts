import { useRef, useCallback } from 'react';
import { DRAG } from '../../constants';

interface UseLongPressOptions {
    /**
     * Duration in ms before long press is triggered
     * @default DRAG.LONG_PRESS_DURATION (400ms)
     */
    duration?: number;
    /**
     * Distance in px that cancels long press if moved
     * @default DRAG.LONG_PRESS_CANCEL_DISTANCE (10px)
     */
    cancelDistance?: number;
    /**
     * Callback when long press is detected
     */
    onLongPress: (x: number, y: number) => void;
    /**
     * Optional callback when long press is cancelled
     */
    onCancel?: () => void;
    /**
     * Optional callback for regular click (short press)
     */
    onClick?: () => void;
}

interface UseLongPressReturn {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for handling long press gestures on touch and mouse devices.
 * iOS-like long press behavior with movement cancellation.
 *
 * @example
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   onLongPress: (x, y) => console.log('Long pressed at', x, y),
 *   onClick: () => console.log('Clicked'),
 * });
 *
 * return <div {...longPressHandlers}>Press me</div>;
 * ```
 */
export function useLongPress({
    duration = DRAG.LONG_PRESS_DURATION,
    cancelDistance = DRAG.LONG_PRESS_CANCEL_DISTANCE,
    onLongPress,
    onCancel,
    onClick,
}: UseLongPressOptions): UseLongPressReturn {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const isLongPressTriggeredRef = useRef(false);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleStart = useCallback(
        (x: number, y: number) => {
            clearTimer();
            startPosRef.current = { x, y };
            isLongPressTriggeredRef.current = false;

            timerRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                onLongPress(x, y);
                timerRef.current = null;
            }, duration);
        },
        [duration, onLongPress, clearTimer]
    );

    const handleMove = useCallback(
        (x: number, y: number) => {
            if (!startPosRef.current || !timerRef.current) return;

            const deltaX = Math.abs(x - startPosRef.current.x);
            const deltaY = Math.abs(y - startPosRef.current.y);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > cancelDistance) {
                clearTimer();
                startPosRef.current = null;
                onCancel?.();
            }
        },
        [cancelDistance, clearTimer, onCancel]
    );

    const handleEnd = useCallback(() => {
        const wasLongPress = isLongPressTriggeredRef.current;
        clearTimer();

        // Only trigger click if not a long press
        if (!wasLongPress && startPosRef.current && onClick) {
            onClick();
        }

        startPosRef.current = null;
        isLongPressTriggeredRef.current = false;
    }, [clearTimer, onClick]);

    // Touch handlers
    const onTouchStart = useCallback(
        (e: React.TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            handleStart(touch.clientX, touch.clientY);
        },
        [handleStart]
    );

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            handleMove(touch.clientX, touch.clientY);
        },
        [handleMove]
    );

    const onTouchEnd = useCallback(
        (_e: React.TouchEvent) => {
            handleEnd();
        },
        [handleEnd]
    );

    // Mouse handlers
    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            handleStart(e.clientX, e.clientY);
        },
        [handleStart]
    );

    const onMouseMove = useCallback(
        (e: React.MouseEvent) => {
            handleMove(e.clientX, e.clientY);
        },
        [handleMove]
    );

    const onMouseUp = useCallback(
        (_e: React.MouseEvent) => {
            handleEnd();
        },
        [handleEnd]
    );

    const onMouseLeave = useCallback(
        (_e: React.MouseEvent) => {
            clearTimer();
            startPosRef.current = null;
        },
        [clearTimer]
    );

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
    };
}
