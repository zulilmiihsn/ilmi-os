'use client';

import { useRef, useCallback } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import {
	animateAppCloseToIcon,
	applyAppDragTransform,
	releaseTopPanel,
	resetAppContainerStyles,
	snapAppContainerOpen,
	trackTopPanelPull,
} from './gestureHelpers';

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
	pagesSliderRef?: React.RefObject<HTMLDivElement | null>;
	notificationCenterRef?: React.RefObject<HTMLDivElement | null>;
	controlCenterRef?: React.RefObject<HTMLDivElement | null>;
	isNotificationCenterOpen?: boolean;
	isControlCenterOpen?: boolean;
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
	pagesSliderRef,
	notificationCenterRef,
	controlCenterRef,
	isNotificationCenterOpen,
	isControlCenterOpen,
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
		animateAppCloseToIcon(container, currentApp || appToOpen);

		closeAnimationTimeoutRef.current = setTimeout(() => {
			closeApp();
			setCurrentApp(null);
			if (container) resetAppContainerStyles(container);
			isAnimatingCloseRef.current = false;
		}, 350);
	}, [closeApp, setCurrentApp, cancelPendingClose, appContainerRef, currentApp, appToOpen]);

	// Bottom pointer handlers for Home Indicator
	const handleBottomPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (isAnimatingCloseRef.current) return;
			if (!(currentApp || appToOpen)) return;

			try {
				(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
			} catch {}

			bottomPointerStartRef.current = { y: e.clientY, time: Date.now() };
			if (appContainerRef.current) {
				appContainerRef.current.style.transition = 'none';
			}
		},
		[currentApp, appToOpen, appContainerRef]
	);

	const handleBottomPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!bottomPointerStartRef.current || isAnimatingCloseRef.current) return;
			if (!(currentApp || appToOpen) || !appContainerRef.current) return;

			const deltaY = bottomPointerStartRef.current.y - e.clientY;
			if (deltaY > 0) {
				applyAppDragTransform(appContainerRef.current, deltaY);
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
				snapAppContainerOpen(appContainerRef.current, isAnimatingCloseRef);
			}
		},
		[triggerCloseApp, appContainerRef]
	);

	const handleBottomPointerCancel = useCallback(() => {
		bottomPointerStartRef.current = null;
		if (appContainerRef.current && !isAnimatingCloseRef.current) {
			snapAppContainerOpen(appContainerRef.current, isAnimatingCloseRef, 'transform 0.3s ease');
		}
	}, [appContainerRef]);

	// Touch event refs
	const touchStartRef = useRef<{
		x: number;
		y: number;
		startTime: number;
		isTopSwipe: boolean;
		isTopRight: boolean;
		isBottomSwipe: boolean;
		isPageSwipe: boolean;
	} | null>(null);
	// A touch that begins on an app icon is an icon interaction
	// (tap, hold, or drag) — never a page swipe — even before the dnd-kit
	// sensor delay elapses and activates the drag guards.
	const iconTouchRef = useRef(false);

	const handleTouchStart = (e: React.TouchEvent) => {
		if (isAnimatingCloseRef.current) return;
		const touch = e.touches[0];
		if (!touch) return;
		const target = e.target as HTMLElement | null;
		iconTouchRef.current = Boolean(target?.closest?.('[data-app-id]'));
		const isBottomTarget = Boolean(target?.closest?.('.ios-bottom-bar'));
		const isBottom = touch.clientY >= window.innerHeight - 85 || isBottomTarget;

		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			startTime: Date.now(),
			isBottomSwipe: Boolean((currentApp || appToOpen) && isBottom),
			isTopSwipe: touch.clientY <= 90,
			isTopRight: touch.clientX > window.innerWidth * 0.58,
			isPageSwipe: false,
		};
	};

	const dragging = () => isDraggingRef?.current || isDragging;

	const handleTouchMove = (e: React.TouchEvent) => {
		if (dragging() || !touchStartRef.current) return;

		const touch = touchStartRef.current;
		const moveTouch = e.touches[0];
		if (!moveTouch) return;
		const cx = moveTouch.clientX;
		const cy = moveTouch.clientY;
		const deltaX = cx - touch.x;
		const deltaY = cy - touch.y; // Positive when pulled DOWN

		// Top Swipe Down Real-Time Panel Tracking
		if (touch.isTopSwipe && deltaY > 0) {
			trackTopPanelPull(
				touch.isTopRight ? controlCenterRef?.current : notificationCenterRef?.current,
				cy
			);
			return;
		}

		// Close App Swipe Logic
		if (touch.isBottomSwipe && appContainerRef.current) {
			const swipeUpY = touch.y - cy;
			if (swipeUpY > 0) {
				appContainerRef.current.style.transition = 'none';
				applyAppDragTransform(appContainerRef.current, swipeUpY);
			}
			return;
		}

		// Home Screen Horizontal Page Tracking with Edge Rubber-Banding
		if (
			!currentApp &&
			!appToOpen &&
			!iconTouchRef.current &&
			!touch.isTopSwipe &&
			!isNotificationCenterOpen &&
			!isControlCenterOpen &&
			pagesSliderRef?.current
		) {
			if (!touch.isPageSwipe && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
				touch.isPageSwipe = true;
			}
			if (touch.isPageSwipe) {
				const atStartEdge = currentPage === 0 && deltaX > 0;
				const atEndEdge = currentPage === 1 && deltaX < 0;
				const effectiveDx = atStartEdge || atEndEdge ? deltaX * 0.28 : deltaX;
				pagesSliderRef.current.style.transition = 'none';
				pagesSliderRef.current.style.transform = `translateX(calc(-${currentPage * 100}vw + ${effectiveDx}px))`;
			}
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		const startedOnIcon = iconTouchRef.current;
		iconTouchRef.current = false;
		if (dragging() || !touchStartRef.current || isAnimatingCloseRef.current) {
			if (pagesSliderRef?.current) {
				pagesSliderRef.current.style.transition = '';
				pagesSliderRef.current.style.transform = `translateX(-${currentPage * 100}vw)`;
			}
			touchStartRef.current = null;
			return;
		}

		const touch = touchStartRef.current;
		touchStartRef.current = null;

		const endTouch = e.changedTouches[0];
		if (!endTouch) return;
		const deltaX = endTouch.clientX - touch.x;
		const deltaY = endTouch.clientY - touch.y; // Positive when pulled down
		const elapsed = Math.max(1, Date.now() - touch.startTime);

		// Top Swipe Down Release (Snaps Open or Snaps Back)
		if (touch.isTopSwipe) {
			const verticalVelocity = deltaY / elapsed;
			const isDeliberateSwipe =
				(deltaY >= 50 || (deltaY >= 30 && verticalVelocity > 0.25)) && deltaY > Math.abs(deltaX);
			if (touch.isTopRight) {
				releaseTopPanel(controlCenterRef?.current, isDeliberateSwipe);
				if (isDeliberateSwipe) {
					setIsControlCenterOpen?.(true);
					setIsNotificationCenterOpen?.(false);
					onOpenControlCenter?.();
				} else {
					setIsControlCenterOpen?.(false);
				}
			} else {
				releaseTopPanel(notificationCenterRef?.current, isDeliberateSwipe);
				if (isDeliberateSwipe) {
					setIsNotificationCenterOpen?.(true);
					setIsControlCenterOpen?.(false);
					onOpenNotificationCenter?.();
				} else {
					setIsNotificationCenterOpen?.(false);
				}
			}
			return;
		}

		// Page Swipe Logic (when on home screen). Touches that began on an
		// icon are icon interactions even when the dnd-kit sensor never fired,
		// so they must not flip pages on release.
		if (!currentApp && !appToOpen && !startedOnIcon) {
			const horizontalVelocity = Math.abs(deltaX) / elapsed;
			const SWIPE_THRESHOLD = window.innerWidth * 0.25;
			const isFastFlick = Math.abs(deltaX) > 25 && horizontalVelocity > 0.25;
			let nextPage = currentPage;
			if ((deltaX < -SWIPE_THRESHOLD || (deltaX < 0 && isFastFlick)) && currentPage < 1) {
				nextPage = 1;
			} else if ((deltaX > SWIPE_THRESHOLD || (deltaX > 0 && isFastFlick)) && currentPage > 0) {
				nextPage = 0;
			}
			if (pagesSliderRef?.current) {
				pagesSliderRef.current.style.transition = '';
				pagesSliderRef.current.style.transform = `translateX(-${nextPage * 100}vw)`;
			}
			if (nextPage !== currentPage) {
				setCurrentPage(nextPage);
			}
		}

		// Close App Swipe Logic (Swiping UP from bottom)
		const activeApp = currentApp || appToOpen;
		if (touch.isBottomSwipe && activeApp && appContainerRef.current) {
			const swipeUpDistance = touch.y - endTouch.clientY; // Positive when swiped UP
			if (swipeUpDistance > 25) {
				triggerCloseApp();
			} else {
				snapAppContainerOpen(appContainerRef.current, isAnimatingCloseRef);
			}
		}
	};

	// A cancelled touch carries no usable coordinates: drop the gesture
	// start so a later touch cannot reuse stale tracking state.
	const handleTouchCancel = useCallback(() => {
		touchStartRef.current = null;
		iconTouchRef.current = false;
		if (pagesSliderRef?.current) {
			pagesSliderRef.current.style.transition = '';
			pagesSliderRef.current.style.transform = `translateX(-${currentPage * 100}vw)`;
		}
	}, [currentPage, pagesSliderRef]);

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
