'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Return keyboard focus to the element that opened a dialog when it closes.
 *
 * The opener cannot be read as `document.activeElement` when the dialog
 * mounts: the dialog's own autofocus moves focus first. Instead, the last two
 * focus targets are tracked; if focus is already inside the dialog when it
 * opens, the previous target is the opener.
 */
export function useRestoreFocus(active: boolean, rootRef?: RefObject<HTMLElement | null>): void {
	const historyRef = useRef<(Element | null)[]>([]);

	useEffect(() => {
		const onFocusIn = (event: FocusEvent) => {
			const previous = historyRef.current[0] ?? null;
			historyRef.current = [event.target as Element, previous].slice(0, 2);
		};
		document.addEventListener('focusin', onFocusIn);
		return () => document.removeEventListener('focusin', onFocusIn);
	}, []);

	useEffect(() => {
		if (!active) return;
		const [current, previous] = historyRef.current;
		const inside = rootRef?.current && current instanceof Node && rootRef.current.contains(current);
		const trigger = inside ? previous : current;
		return () => {
			if (trigger instanceof HTMLElement && trigger.isConnected) {
				trigger.focus({ preventScroll: true });
			}
		};
	}, [active, rootRef]);
}
