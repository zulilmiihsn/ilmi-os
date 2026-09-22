'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Keep Tab navigation inside a modal dialog while it is active.
 * Only containers that truly block background interaction should use this.
 */
export function useFocusTrap(active: boolean, rootRef?: RefObject<HTMLElement | null>): void {
	useEffect(() => {
		if (!active) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;
			const root = rootRef?.current;
			if (!root) return;
			const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
				el => !el.hasAttribute('disabled') && el.offsetParent !== null
			);
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', onKeyDown, true);
		return () => document.removeEventListener('keydown', onKeyDown, true);
	}, [active, rootRef]);
}
