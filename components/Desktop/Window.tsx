'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWindowsStore } from '../../stores/windows';
import { useAppsStore } from '../../stores/apps';
import type { WindowState } from '../../types';
import { getAppComponent } from '../../utils/appComponents';
import { TIMING } from '../../constants';
import { useWindowDragResize } from './Window/useWindowDragResize';
import WindowHeader from './Window/WindowHeader';

interface WindowProps {
	window: WindowState;
}

export default function Window({ window: windowProp }: WindowProps) {
	const [isClosing, setIsClosing] = useState(false);
	const [isMinimizing, setIsMinimizing] = useState(false);
	const [isOpening, setIsOpening] = useState(true);
	// Restore replays the minimize trip in reverse (macOS behavior). It starts
	// during render — not in an effect — so the first paint is already at the
	// dock icon instead of flashing full-size for a frame.
	const [isRestoring, setIsRestoring] = useState(false);
	const [prevMinimized, setPrevMinimized] = useState(windowProp.isMinimized);

	const windowState = useWindowsStore(
		state => state.windows.find(w => w.id === windowProp.id) || windowProp
	) as WindowState;

	const { isDragging, isResizing, windowRef, interactionRef, handleMouseDown, handleResizeStart } =
		useWindowDragResize(windowState);

	const app = useAppsStore(state => state.apps.find(a => a.id === windowState.appId));

	const Component = useMemo(() => {
		if (!app?.component) return null;
		return getAppComponent(app.component);
	}, [app?.component]);

	useEffect(() => {
		if (!isOpening) return;
		const timer = setTimeout(() => setIsOpening(false), TIMING.WINDOW_OPEN_DELAY);
		return () => clearTimeout(timer);
	}, [isOpening]);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		const id = windowState.id;
		setTimeout(() => useWindowsStore.getState().closeWindow(id), TIMING.WINDOW_CLOSE_DURATION);
	}, [windowState.id]);

	// A restore (Show All) flips isMinimized back while the stale minimizing
	// animation state is still set; drop it so the window does not render at
	// Dock size with zero opacity. The reverse trip itself starts during render
	// below; this effect only refreshes the dock target (the dock may have
	// moved) and finishes the trip after paint.
	const prevMinimizedRef = useRef(false);
	useEffect(() => {
		if (prevMinimizedRef.current && !windowState.isMinimized) {
			if (typeof document !== 'undefined') {
				const dockIcon = document.querySelector(`[data-app-id="${windowState.appId}"]`);
				if (dockIcon) {
					const rect = dockIcon.getBoundingClientRect();
					interactionRef.current.minimizeTarget = {
						x: rect.left,
						y: rect.top,
						width: rect.width,
						height: rect.height,
					};
				}
			}
		}
		prevMinimizedRef.current = windowState.isMinimized;
	}, [windowState.isMinimized, windowState.appId, interactionRef]);

	useEffect(() => {
		if (!isRestoring) return;
		// Double rAF: let the small frame paint before growing to full size.
		// Keyed on the state itself (not the restore edge) so a StrictMode
		// remount reschedules instead of stranding the window at dock size.
		const raf1 = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsRestoring(false);
				interactionRef.current.minimizeTarget = null;
			});
		});
		return () => cancelAnimationFrame(raf1);
	}, [isRestoring, interactionRef]);

	const handleMinimize = useCallback(() => {
		if (typeof document !== 'undefined') {
			const dockIcon = document.querySelector(`[data-app-id="${windowState.appId}"]`);
			if (dockIcon) {
				const rect = dockIcon.getBoundingClientRect();
				interactionRef.current.minimizeTarget = {
					x: rect.left,
					y: rect.top,
					width: rect.width,
					height: rect.height,
				};
			}
		}
		setIsMinimizing(true);
		const id = windowState.id;
		setTimeout(
			() => useWindowsStore.getState().minimizeWindow(id),
			TIMING.WINDOW_MINIMIZE_DURATION
		);
	}, [windowState.id, windowState.appId, interactionRef]);

	const handleMaximize = useCallback(() => {
		useWindowsStore.getState().maximizeWindow(windowState.id);
	}, [windowState.id]);

	const handleActivate = useCallback(() => {
		if (!windowState.isFocused) {
			useWindowsStore.getState().focusWindow(windowState.id);
		}
	}, [windowState.id, windowState.isFocused]);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			// Maximize only from non-interactive header space so that
			// double-clicking app content never changes window geometry.
			if (target.closest('.window-header') && !target.closest('button')) {
				handleMaximize();
			}
		},
		[handleMaximize]
	);

	// Minimize/restore edge handled during render — BEFORE the minimized
	// early-return below, or the restore trip never starts (and the stale
	// minimizing state strands the window at dock size with zero opacity).
	// The commit that flips isMinimized paints small immediately (no
	// full-size flash), then the effect above grows the window back after
	// paint. Idempotent under double render.
	if (prevMinimized !== windowState.isMinimized) {
		setPrevMinimized(windowState.isMinimized);
		if (prevMinimized && !windowState.isMinimized) {
			setIsMinimizing(false);
			if (interactionRef.current.minimizeTarget) {
				setIsRestoring(true);
			}
		}
	}

	if (windowState.isMinimized) return null;

	const windowStyle: React.CSSProperties = { zIndex: windowState.zIndex, top: 0, left: 0 };

	if ((isMinimizing || isRestoring) && interactionRef.current.minimizeTarget) {
		const target = interactionRef.current.minimizeTarget;
		windowStyle.width = `${target.width}px`;
		windowStyle.height = `${target.height}px`;
		windowStyle.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
		windowStyle.opacity = 0;
	} else if (isOpening && windowState.originRect) {
		windowStyle.width = `${windowState.originRect.width}px`;
		windowStyle.height = `${windowState.originRect.height}px`;
		windowStyle.transform = `translate3d(${windowState.originRect.x}px, ${windowState.originRect.y}px, 0)`;
		windowStyle.opacity = 0;
	} else {
		windowStyle.width = windowState.isMaximized ? '100%' : `${windowState.width}px`;
		windowStyle.height = windowState.isMaximized ? '100%' : `${windowState.height}px`;
		const transform = windowState.isMaximized
			? 'translate3d(0, 0, 0)'
			: `translate3d(${windowState.x}px, ${windowState.y}px, 0)`;
		windowStyle.transform = isClosing ? `${transform} scale(0.9)` : transform;
	}

	const containerClasses = [
		'fixed flex flex-col',
		'rounded-xl overflow-hidden',
		'border border-black/10 dark:border-white/10',
		'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]',
		'will-change-[transform,width,height]',
		'transition-[transform,width,height,opacity] duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)]',
		windowState.isFocused
			? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_0_1px_0_rgba(0,0,0,0.5)] dark:shadow-[0_30px_80px_-10px_rgba(0,0,0,0.6)] z-50'
			: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] grayscale-[0.05] opacity-95 z-10',
		isOpening && !windowState.originRect ? 'opacity-0 scale-95' : 'opacity-100',
		isClosing ? 'opacity-0 pointer-events-none' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			ref={windowRef}
			className={containerClasses}
			style={windowStyle}
			onMouseDownCapture={handleActivate}
			onMouseDown={e => handleMouseDown(e, windowState)}
			onDoubleClick={handleDoubleClick}
		>
			<WindowHeader
				windowState={windowState}
				isDragging={isDragging}
				isResizing={isResizing}
				onClose={handleClose}
				onMinimize={handleMinimize}
				onMaximize={handleMaximize}
			/>

			<div
				className={`window-content flex-1 bg-white dark:bg-[#1E1E1E] overflow-hidden relative
				${!windowState.isFocused && 'pointer-events-none opacity-95'}`}
			>
				<div className="absolute inset-0 overflow-auto macos-scrollbar">
					{Component && <Component />}
					{!Component && (
						<div className="p-4 flex items-center justify-center h-full text-gray-400">
							<div className="text-center">
								<p className="font-medium">App: {app?.name}</p>
								<p className="text-sm">Under Development</p>
							</div>
						</div>
					)}
				</div>
				{!windowState.isFocused && <div className="absolute inset-0 z-10" />}
			</div>

			{!windowState.isMaximized && (
				<button
					className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 opacity-0 focus-visible:opacity-100 focus-visible:bg-[#007AFF]/40 focus-visible:rounded-tl-lg focus:outline-none"
					onMouseDown={e => handleResizeStart(e, windowState)}
					onKeyDown={e => {
						if (e.key !== 'Enter' && e.key !== ' ') return;
						e.preventDefault();
						// Keyboard alternative: toggle a 100px step so keyboard
						// users are not limited to pointer resizing.
						useWindowsStore.getState().updateWindow(windowState.id, {
							width: Math.max(320, windowState.width + (e.shiftKey ? -100 : 100)),
							height: Math.max(200, windowState.height + (e.shiftKey ? -100 : 100)),
						});
					}}
					aria-label="Resize"
					tabIndex={0}
				/>
			)}
		</div>
	);
}
