import { useRef, useEffect } from 'react';

interface UseHomeScreenGesturesProps {
    isDragging: boolean;
    currentApp: string | null;
    appToOpen: string | null;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    closeApp: (appId: string) => void;
    setCurrentApp: (appId: string | null) => void;
    appContainerRef: React.RefObject<HTMLDivElement>;
}

export function useHomeScreenGestures({
    isDragging,
    currentApp,
    appToOpen,
    currentPage,
    setCurrentPage,
    closeApp,
    setCurrentApp,
    appContainerRef,
}: UseHomeScreenGesturesProps) {
    const touchStartRef = useRef<{ x: number; y: number; isBottomSwipe: boolean } | null>(null);
    const isAnimatingCloseRef = useRef(false);

    // Reset styles whenever currentApp transitions to null
    useEffect(() => {
        if (!currentApp && appContainerRef.current) {
            appContainerRef.current.style.transform = '';
            appContainerRef.current.style.opacity = '';
            appContainerRef.current.style.transition = '';
            appContainerRef.current.style.willChange = '';
            isAnimatingCloseRef.current = false;
        }
    }, [currentApp, appContainerRef]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isDragging || isAnimatingCloseRef.current) return;
        const touch = e.touches[0];
        const isBottom = touch.clientY >= window.innerHeight - 55;

        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            isBottomSwipe: Boolean(currentApp && isBottom),
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging || !touchStartRef.current || isAnimatingCloseRef.current) return;

        const touch = touchStartRef.current;
        const cy = e.touches[0].clientY;

        // Close App Swipe Logic
        if (touch.isBottomSwipe && appContainerRef.current) {
            const deltaY = touch.y - cy;
            if (deltaY > 0) {
                const progress = Math.min(100, (deltaY / window.innerHeight) * 100);
                const scale = Math.max(0.88, 1 - (progress * 0.0015));
                appContainerRef.current.style.transition = 'none';
                appContainerRef.current.style.transform = `translate3d(0, -${progress}%, 0) scale(${scale})`;
                appContainerRef.current.style.borderRadius = `${Math.min(40, progress * 0.8)}px`;
                appContainerRef.current.style.opacity = progress > 75
                    ? String(Math.max(0, 1 - (progress - 75) / 25))
                    : '1';
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isDragging || !touchStartRef.current || isAnimatingCloseRef.current) {
            touchStartRef.current = null;
            return;
        }

        const touch = touchStartRef.current;
        const cx = e.changedTouches[0].clientX;
        const cy = e.changedTouches[0].clientY;
        const deltaX = cx - touch.x;
        const deltaY = touch.y - cy;

        // Page Swipe Logic (when on home screen)
        if (!currentApp && !appToOpen) {
            const SWIPE_THRESHOLD = window.innerWidth * 0.2;
            if (deltaX < -SWIPE_THRESHOLD && currentPage < 1) setCurrentPage(1);
            if (deltaX > SWIPE_THRESHOLD && currentPage > 0) setCurrentPage(0);
        }

        // Close App Swipe Logic
        if (touch.isBottomSwipe && currentApp && appContainerRef.current) {
            const container = appContainerRef.current;

            if (deltaY > window.innerHeight * 0.12) {
                // Trigger Close Animation
                isAnimatingCloseRef.current = true;
                container.style.willChange = 'transform, opacity';
                container.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease-out, border-radius 0.25s ease-out';
                container.style.transform = 'translate3d(0, -100%, 0) scale(0.85)';
                container.style.opacity = '0';
                container.style.borderRadius = '40px';

                const targetApp = currentApp;
                setTimeout(() => {
                    closeApp(targetApp);
                    setCurrentApp(null);
                }, 260);
            } else {
                // Cancel Swipe & Snap back to full screen
                container.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease-out, border-radius 0.25s ease-out';
                container.style.transform = 'translate3d(0, 0, 0) scale(1)';
                container.style.opacity = '1';
                container.style.borderRadius = '0px';

                setTimeout(() => {
                    if (container) {
                        container.style.transition = '';
                        container.style.transform = '';
                        container.style.opacity = '';
                        container.style.borderRadius = '';
                        container.style.willChange = '';
                    }
                }, 260);
            }
        }

        touchStartRef.current = null;
    };

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}
