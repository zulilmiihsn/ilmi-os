'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface UseAppLauncherProps {
	isDragging: boolean;
	launchApp: (appId: string) => void;
	setIsEditing: (editing: boolean) => void;
	cancelPendingCloseRef: { current: () => void };
}

export function useAppLauncher({
	isDragging,
	launchApp,
	setIsEditing,
	cancelPendingCloseRef,
}: UseAppLauncherProps) {
	const [currentApp, setCurrentApp] = useState<string | null>(null);
	const [appToOpen, setAppToOpen] = useState<string | null>(null);
	const [isOpening, setIsOpening] = useState(false);
	const [appOpenOrigin, setAppOpenOrigin] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear a pending app-open if the home screen unmounts first.
	useEffect(() => {
		return () => {
			if (openTimeoutRef.current) {
				clearTimeout(openTimeoutRef.current);
				openTimeoutRef.current = null;
			}
		};
	}, []);

	const handleAppClick = useCallback(
		(appId: string) => {
			if (isDragging) return;

			// Opening an app leaves edit mode, like iOS.
			setIsEditing(false);

			// SYNCHRONOUSLY kill any pending close timeout to prevent race condition
			cancelPendingCloseRef.current();

			triggerHaptic('light');

			const iconElement = document.querySelector(`[data-app-id="${appId}"]`) as HTMLElement | null;
			if (iconElement) {
				const rect = iconElement.getBoundingClientRect();
				setAppOpenOrigin({
					x: rect.left,
					y: rect.top,
					width: rect.width,
					height: rect.height,
				});
			} else {
				setAppOpenOrigin(null);
			}

			if (openTimeoutRef.current) {
				clearTimeout(openTimeoutRef.current);
				openTimeoutRef.current = null;
			}

			// Instant App Activation
			launchApp(appId);
			setCurrentApp(appId);
			setAppToOpen(appId);
			setIsOpening(true);

			openTimeoutRef.current = setTimeout(() => {
				setAppToOpen(null);
				setIsOpening(false);
				openTimeoutRef.current = null;
			}, 260);
		},
		[isDragging, launchApp, setIsEditing, cancelPendingCloseRef]
	);

	// Cross-app requests (e.g. the Camera thumbnail opens Photos).
	useEffect(() => {
		const onOpenAppEvent = (e: Event) => {
			const id = (e as CustomEvent<string>).detail;
			if (typeof id === 'string' && id) handleAppClick(id);
		};
		window.addEventListener('ilmi:open-app', onOpenAppEvent);
		return () => window.removeEventListener('ilmi:open-app', onOpenAppEvent);
	}, [handleAppClick]);

	return {
		currentApp,
		setCurrentApp,
		appToOpen,
		isOpening,
		appOpenOrigin,
		handleAppClick,
	};
}
