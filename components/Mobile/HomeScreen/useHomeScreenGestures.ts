'use client';

import { useRef, useCallback } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface UseHomeScreenGesturesProps {
	isDragging: boolean;
	/** Synchronous drag mirror: guards touch handlers against stale React state. */
	isDraggingRef?: { current: boolean };
	currentApp: string | null;
	appToOpen: string | null;
	currentPage: number;
	setCurrentPage: (page: number) => void;
	closeApp: () => void;
	setCurrentApp: (app: string | null) => void;
	appContainerRef: React.RefObject<HTMLDivElement | null>;
	notificationCenterRef?: React.RefObject<HTMLDivElement | null>;
	controlCenterRef?: React.RefObject<HTMLDivElement | null>;
	setIsNotificationCenterOpen?: (open: boolean) => void;
	setIsControlCenterOpen?: (open: boolean) => void;
	onOpenNotificationCenter?: () => void;
	onOpenControlCenter?: () => void;
}

export function useHomeScreenGestures({
	isDragging,
	isDraggingRef,
	currentApp,
	appToOpen,
	currentPage,
	setCurrentPage,
	closeApp,
	setCurrentApp,
	appContainerRef,
	notificationCenterRef,
	controlCenterRef,
	setIsNotificationCenterOpen,
	setIsControlCenterOpen,
	onOpenNotificationCenter,
	onOpenControlCenter,
}: UseHomeScreenGesturesProps) {
	const isAnimatingCloseRef = useRef(false);
	const bottomPointerStartRef = useRef<{ y: number; time: number } | null>(null);
	const closeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const cancelPendingClose = useCallback(() => {
		if (closeAnimationTimeoutRef.current) {
			clearTimeout(closeAnimationTimeoutRef.current);
			closeAnimationTimeoutRef.current = null;
		}
		isAnimatingCloseRef.current = false;
	}, []);

	// Direct Close Animation Function with local state reset
	const triggerCloseApp = useCallback(() => {
		if (isAnimatingCloseRef.current) return;
		const container = appContainerRef.current;
		if (!container) {
			closeApp();
			setCurrentApp(null);
			return;
		}

		cancelPendingClose();
		isAnimatingCloseRef.current = true;
		triggerHaptic('medium');
		container.style.pointerEvents = 'none';
		container.style.willChange = 'transform, opacity';
		container.style.transition =
			'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
		container.style.transform = 'translate3d(0, 80%, 0) scale(0.7)';
		container.style.opacity = '0';

		closeAnimationTimeoutRef.current = setTimeout(() => {
			closeApp();
			setCurrentApp(null);
			if (container) {
				container.style.transition = '';
				container.style.transform = '';
				container.style.opacity = '';
				container.style.pointerEvents = '';
				container.style.borderRadius = '';
				container.style.willChange = '';
			}
			isAnimatingCloseRef.current = false;
		}, 350);
	}, [closeApp, setCurrentApp, cancelPendingClose, appContainerRef]);

	// Bottom pointer handlers for Home Indicator
	const handleBottomPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (isAnimatingCloseRef.current) return;
			const activeApp = currentApp || appToOpen;
			if (!activeApp) return;

			try {
				(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
			} catch {}

			bottomPointerStartRef.current = {
				y: e.clientY,
				time: Date.now(),
			};

			if (appContainerRef.current) {
				appContainerRef.current.style.transition = 'none';
			}
		},
		[currentApp, appToOpen, appContainerRef]
	);

	const handleBottomPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!bottomPointerStartRef.current || isAnimatingCloseRef.current) return;
			const activeApp = currentApp || appToOpen;
			if (!activeApp || !appContainerRef.current) return;

			const deltaY = bottomPointerStartRef.current.y - e.clientY;
			if (deltaY > 0) {
				const progress = Math.min(100, (deltaY / window.innerHeight) * 100);
				const scale = Math.max(0.85, 1 - progress * 0.0018);
				appContainerRef.current.style.transform = `translate3d(0, -${progress}%, 0) scale(${scale})`;
				appContainerRef.current.style.borderRadius = `${Math.min(40, progress * 0.8)}px`;
				appContainerRef.current.style.opacity =
					progress > 70 ? String(Math.max(0, 1 - (progress - 70) / 30)) : '1';
			}
		},
		[currentApp, appToOpen, appContainerRef]
	);

	const handleBottomPointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (!bottomPointerStartRef.current || isAnimatingCloseRef.current) {
				bottomPointerStartRef.current = null;
				return;
			}

			try {
				(e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
			} catch {}

			const start = bottomPointerStartRef.current;
			bottomPointerStartRef.current = null;
			const deltaY = start.y - e.clientY;

			// Any upward swipe > 25px triggers close
			if (deltaY > 25) {
				triggerCloseApp();
			} else if (appContainerRef.current) {
				const container = appContainerRef.current;
				container.style.transition =
					'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease';
				container.style.transform = 'translate3d(0, 0, 0) scale(1)';
				container.style.opacity = '1';
				container.style.borderRadius = '';

				setTimeout(() => {
					if (container && !isAnimatingCloseRef.current) {
						container.style.transition = '';
						container.style.transform = '';
						container.style.opacity = '';
						container.style.borderRadius = '';
					}
				}, 300);
			}
		},
		[triggerCloseApp, appContainerRef]
	);

	const handleBottomPointerCancel = useCallback(() => {
		bottomPointerStartRef.current = null;
		if (appContainerRef.current && !isAnimatingCloseRef.current) {
			const container = appContainerRef.current;
			container.style.transition = 'transform 0.3s ease';
			container.style.transform = 'translate3d(0, 0, 0) scale(1)';
			container.style.opacity = '1';
			setTimeout(() => {
				if (container && !isAnimatingCloseRef.current) {
					container.style.transition = '';
					container.style.transform = '';
					container.style.opacity = '';
					container.style.borderRadius = '';
				}
			}, 300);
		}
	}, [appContainerRef]);

	// Touch event refs
	const touchStartRef = useRef<{
		x: number;
		y: number;
		isTopSwipe: boolean;
		isTopRight: boolean;
		isBottomSwipe: boolean;
	} | null>(null);

	const handleTouchStart = (e: React.TouchEvent) => {
		if (isAnimatingCloseRef.current) return;
		const touch = e.touches[0];
		if (!touch) return;
		const target = e.target as HTMLElement | null;
		const isBottomTarget = Boolean(target?.closest?.('.ios-bottom-bar'));
		const isBottom = touch.clientY >= window.innerHeight - 85 || isBottomTarget;
		const isTop = touch.clientY <= 90;
		const isTopRight = touch.clientX > window.innerWidth * 0.58;

		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			isBottomSwipe: Boolean((currentApp || appToOpen) && isBottom),
			isTopSwipe: isTop,
			isTopRight,
		};
	};

	const dragging = () => isDraggingRef?.current || isDragging;

	const handleTouchMove = (e: React.TouchEvent) => {
		if (dragging() || !touchStartRef.current) return;

		const touch = touchStartRef.current;
		const moveTouch = e.touches[0];
		if (!moveTouch) return;
		const cy = moveTouch.clientY;
		const deltaY = cy - touch.y; // Positive when pulled DOWN

		// Top Swipe Down Real-Time Panel Tracking
		if (touch.isTopSwipe && deltaY > 0) {
			if (touch.isTopRight) {
				const panel = controlCenterRef?.current;
				if (panel) {
					const translateY = Math.min(0, cy - window.innerHeight);
					panel.style.transition = 'none';
					panel.style.transform = `translate3d(0, ${translateY}px, 0)`;
					panel.style.opacity = '1';
					panel.style.pointerEvents = 'auto';
				}
			} else {
				const panel = notificationCenterRef?.current;
				if (panel) {
					const translateY = Math.min(0, cy - window.innerHeight);
					panel.style.transition = 'none';
					panel.style.transform = `translate3d(0, ${translateY}px, 0)`;
					panel.style.opacity = '1';
					panel.style.pointerEvents = 'auto';
				}
			}
			return;
		}

		// Close App Swipe Logic
		if (touch.isBottomSwipe && appContainerRef.current) {
			const swipeUpY = touch.y - cy;
			if (swipeUpY > 0) {
				const progress = Math.min(100, (swipeUpY / window.innerHeight) * 100);
				const scale = Math.max(0.85, 1 - progress * 0.0018);
				appContainerRef.current.style.transition = 'none';
				appContainerRef.current.style.transform = `translate3d(0, -${progress}%, 0) scale(${scale})`;
				appContainerRef.current.style.borderRadius = `${Math.min(40, progress * 0.8)}px`;
				appContainerRef.current.style.opacity =
					progress > 70 ? String(Math.max(0, 1 - (progress - 70) / 30)) : '1';
			}
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (dragging() || !touchStartRef.current || isAnimatingCloseRef.current) {
			touchStartRef.current = null;
			return;
		}

		const touch = touchStartRef.current;
		touchStartRef.current = null;

		const endTouch = e.changedTouches[0];
		if (!endTouch) return;
		const cx = endTouch.clientX;
		const cy = endTouch.clientY;
		const deltaX = cx - touch.x;
		const deltaY = cy - touch.y; // Positive when pulled down

		// Top Swipe Down Release (Snaps Open or Snaps Back)
		if (touch.isTopSwipe) {
			if (touch.isTopRight) {
				const panel = controlCenterRef?.current;
				const isDeliberateSwipe = deltaY >= 50 && deltaY > Math.abs(deltaX);
				if (isDeliberateSwipe) {
					triggerHaptic('light');
					if (panel) {
						panel.style.transition =
							'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
						panel.style.transform = 'translate3d(0, 0%, 0)';
						panel.style.opacity = '1';
						panel.style.pointerEvents = 'auto';
						setTimeout(() => {
							if (panel) {
								panel.style.transition = '';
							}
						}, 350);
					}
					if (setIsControlCenterOpen) setIsControlCenterOpen(true);
					if (setIsNotificationCenterOpen) setIsNotificationCenterOpen(false);
					if (onOpenControlCenter) onOpenControlCenter();
				} else {
					if (panel) {
						panel.style.transition =
							'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
						panel.style.transform = 'translate3d(0, -100%, 0)';
						panel.style.opacity = '0';
						panel.style.pointerEvents = 'none';
						// Keep the final inline values: clearing them would
						// drop below React's declared closed style and leave
						// the panel visible until the next render.
						setTimeout(() => {
							if (panel) {
								panel.style.transition = '';
							}
						}, 300);
					}
					if (setIsControlCenterOpen) setIsControlCenterOpen(false);
				}
			} else {
				const panel = notificationCenterRef?.current;
				const isDeliberateSwipe = deltaY >= 50 && deltaY > Math.abs(deltaX);
				if (isDeliberateSwipe) {
					triggerHaptic('light');
					if (panel) {
						panel.style.transition =
							'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
						panel.style.transform = 'translate3d(0, 0%, 0)';
						panel.style.opacity = '1';
						panel.style.pointerEvents = 'auto';
						setTimeout(() => {
							if (panel) {
								panel.style.transition = '';
							}
						}, 350);
					}
					if (setIsNotificationCenterOpen) setIsNotificationCenterOpen(true);
					if (setIsControlCenterOpen) setIsControlCenterOpen(false);
					if (onOpenNotificationCenter) onOpenNotificationCenter();
				} else {
					if (panel) {
						panel.style.transition =
							'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
						panel.style.transform = 'translate3d(0, -100%, 0)';
						panel.style.opacity = '0';
						panel.style.pointerEvents = 'none';
						// Keep the final inline values so the closed panel
						// cannot become visible before the next render.
						setTimeout(() => {
							if (panel) {
								panel.style.transition = '';
							}
						}, 300);
					}
					if (setIsNotificationCenterOpen) setIsNotificationCenterOpen(false);
				}
			}
			return;
		}

		// Page Swipe Logic (when on home screen)
		if (!currentApp && !appToOpen) {
			const SWIPE_THRESHOLD = window.innerWidth * 0.2;
			if (deltaX < -SWIPE_THRESHOLD && currentPage < 1) setCurrentPage(1);
			if (deltaX > SWIPE_THRESHOLD && currentPage > 0) setCurrentPage(0);
		}

		// Close App Swipe Logic (Swiping UP from bottom)
		const activeApp = currentApp || appToOpen;
		if (touch.isBottomSwipe && activeApp && appContainerRef.current) {
			const swipeUpDistance = touch.y - cy; // Positive when swiped UP
			if (swipeUpDistance > 25) {
				triggerCloseApp();
			} else {
				// Snap Back Open
				const container = appContainerRef.current;
				container.style.transition =
					'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease';
				container.style.transform = 'translate3d(0, 0, 0) scale(1)';
				container.style.opacity = '1';
				container.style.borderRadius = '';

				setTimeout(() => {
					if (container && !isAnimatingCloseRef.current) {
						container.style.transition = '';
						container.style.transform = '';
						container.style.opacity = '';
						container.style.borderRadius = '';
					}
				}, 300);
			}
			return;
		}
	};

	// A cancelled touch carries no usable coordinates: drop the gesture
	// start so a later touch cannot reuse stale tracking state.
	const handleTouchCancel = useCallback(() => {
		touchStartRef.current = null;
	}, []);

	return {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleTouchCancel,
		handleBottomPointerDown,
		handleBottomPointerMove,
		handleBottomPointerUp,
		handleBottomPointerCancel,
		triggerCloseApp,
		cancelPendingClose,
	};
}
