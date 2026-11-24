import type { WindowState } from '../types';

export type DesktopShortcutAction = 'close' | 'minimize' | 'switch-next' | 'switch-prev';
export type SwitcherKeyAction = 'cancel' | 'commit' | 'next' | 'prev';

export interface ShortcutKeyEvent {
	key: string;
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const EDITABLE_SELECTOR = '[contenteditable="true"], [role="textbox"]';

function hasGetAttribute(
	target: object
): target is { getAttribute: (name: string) => string | null } {
	return (
		'getAttribute' in target &&
		typeof (target as { getAttribute?: unknown }).getAttribute === 'function'
	);
}

function hasClosest(target: object): target is { closest: (selector: string) => unknown } {
	return 'closest' in target && typeof (target as { closest?: unknown }).closest === 'function';
}

/**
 * Returns true when the event target is an editable form control or lives
 * inside a contenteditable / textbox region. Safe in Node without DOM globals.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
	if (!target || typeof target !== 'object') return false;

	if ('tagName' in target && typeof target.tagName === 'string') {
		if (EDITABLE_TAGS.has(target.tagName.toUpperCase())) return true;
	}

	if ('isContentEditable' in target && target.isContentEditable === true) {
		return true;
	}

	if (hasGetAttribute(target)) {
		if (
			target.getAttribute('contenteditable') === 'true' ||
			target.getAttribute('role') === 'textbox'
		) {
			return true;
		}
	}

	if (hasClosest(target) && Boolean(target.closest(EDITABLE_SELECTOR))) {
		return true;
	}

	if (
		!('tagName' in target) &&
		'parentElement' in target &&
		target.parentElement &&
		typeof target.parentElement === 'object'
	) {
		return isEditableTarget(target.parentElement as EventTarget);
	}

	return false;
}

/**
 * Orders windows by zIndex descending (most recently focused first), matching
 * native macOS Cmd+Tab order where index 0 is the current window and index 1
 * is the previously active window.
 */
export function orderWindowsForSwitcher(windows: WindowState[]): WindowState[] {
	return [...windows].sort((a, b) => {
		if (b.zIndex !== a.zIndex) return b.zIndex - a.zIndex;
		if (a.isFocused !== b.isFocused) return a.isFocused ? -1 : 1;
		return 0;
	});
}

/**
 * Computes the next wrapped index in the App Switcher list, or -1 when empty.
 */
export function nextSwitcherIndex(currentIndex: number, total: number, reverse: boolean): number {
	if (total <= 0) return -1;
	const normalized = ((currentIndex % total) + total) % total;
	return reverse ? (normalized - 1 + total) % total : (normalized + 1) % total;
}

/**
 * Resolves browser-safe Alt-based desktop window shortcuts.
 * Never triggers when Ctrl or Meta is pressed to avoid OS/browser collisions.
 */
export function resolveDesktopShortcut(event: ShortcutKeyEvent): DesktopShortcutAction | null {
	if (!event.altKey || event.ctrlKey || event.metaKey) return null;

	const lower = event.key.toLowerCase();
	if (lower === 'w') return 'close';
	if (lower === 'm') return 'minimize';
	if (event.key === 'Tab') return event.shiftKey ? 'switch-prev' : 'switch-next';

	return null;
}

/**
 * Resolves navigation keys while the App Switcher HUD is open.
 */
export function resolveSwitcherKey(event: ShortcutKeyEvent): SwitcherKeyAction | null {
	if (event.key === 'Escape') return 'cancel';
	if (event.key === 'Enter') return 'commit';
	if (event.key === 'ArrowRight') return 'next';
	if (event.key === 'ArrowLeft') return 'prev';
	const action = resolveDesktopShortcut(event);
	if (action === 'switch-next') return 'next';
	if (action === 'switch-prev') return 'prev';
	return null;
}

/**
 * Returns the initial highlighted index when opening the App Switcher.
 */
export function initialSwitcherIndex(total: number, reverse: boolean): number {
	if (total <= 0) return -1;
	if (total === 1) return 0;
	return reverse ? total - 1 : 1;
}

/**
 * Returns the highest-zIndex non-minimized window excluding an optional id.
 */
export function findTopVisibleWindow(
	windows: WindowState[],
	excludeId?: string
): WindowState | undefined {
	return orderWindowsForSwitcher(windows.filter(w => !w.isMinimized && w.id !== excludeId))[0];
}

/**
 * Returns true when an unrelated modal dialog or Spotlight overlay is open.
 */
export function isModalOrSpotlightOpen(): boolean {
	if (typeof document === 'undefined') return false;
	if (document.querySelector('[role="dialog"]')) return true;
	const spotlight = document.querySelector<HTMLElement>('.spotlight-container');
	return Boolean(spotlight && getComputedStyle(spotlight).visibility === 'visible');
}
