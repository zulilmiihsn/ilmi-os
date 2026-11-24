import { triggerHaptic } from '../../../utils/haptic';

export function applyAppDragTransform(container: HTMLDivElement, swipeUpPx: number): void {
	const progress = Math.min(100, (swipeUpPx / window.innerHeight) * 100);
	const scale = Math.max(0.85, 1 - progress * 0.0018);
	container.style.transform = `translate3d(0, -${progress}%, 0) scale(${scale})`;
	container.style.borderRadius = `${Math.min(40, progress * 0.8)}px`;
	container.style.opacity = progress > 70 ? String(Math.max(0, 1 - (progress - 70) / 30)) : '1';
}

export function snapAppContainerOpen(
	container: HTMLDivElement,
	isAnimatingCloseRef: { current: boolean },
	transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease'
): void {
	container.style.transition = transition;
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

export function trackTopPanelPull(panel: HTMLDivElement | null | undefined, clientY: number): void {
	if (!panel) return;
	const translateY = Math.min(0, clientY - window.innerHeight);
	panel.style.transition = 'none';
	panel.style.transform = `translate3d(0, ${translateY}px, 0)`;
	panel.style.opacity = '1';
	panel.style.pointerEvents = 'auto';
}

export function releaseTopPanel(panel: HTMLDivElement | null | undefined, open: boolean): void {
	if (open) {
		triggerHaptic('light');
		if (!panel) return;
		panel.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
		panel.style.transform = 'translate3d(0, 0%, 0)';
		panel.style.opacity = '1';
		panel.style.pointerEvents = 'auto';
		setTimeout(() => {
			if (panel) {
				panel.style.transition = '';
			}
		}, 350);
		return;
	}

	if (!panel) return;
	panel.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
	panel.style.transform = 'translate3d(0, -100%, 0)';
	panel.style.opacity = '0';
	panel.style.pointerEvents = 'none';
	// Keep the final inline values: clearing them would drop below React's
	// declared closed style and leave the panel visible until the next render.
	setTimeout(() => {
		if (panel) {
			panel.style.transition = '';
		}
	}, 300);
}

export function animateAppCloseToIcon(container: HTMLDivElement, activeApp: string | null): void {
	container.style.pointerEvents = 'none';
	container.style.willChange = 'transform, opacity';
	container.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease';
	// iOS zooms the app back into its icon. Fall back to the generic
	// shrink-and-fade when the icon rect is unavailable.
	const icon = activeApp ? document.querySelector(`[data-app-id="${activeApp}"]`) : null;
	if (icon) {
		const rect = icon.getBoundingClientRect();
		const scale = rect.width / window.innerWidth;
		container.style.transformOrigin = '0 0';
		container.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${scale})`;
		container.style.borderRadius = '40px';
	} else {
		container.style.transform = 'translate3d(0, 80%, 0) scale(0.7)';
	}
	container.style.opacity = '0';
}

export function resetAppContainerStyles(container: HTMLDivElement): void {
	container.style.transition = '';
	container.style.transform = '';
	container.style.transformOrigin = '';
	container.style.opacity = '';
	container.style.pointerEvents = '';
	container.style.borderRadius = '';
	container.style.willChange = '';
}
