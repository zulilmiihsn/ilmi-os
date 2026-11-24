import { describe, it, expect } from 'vitest';
import {
	initialSwitcherIndex,
	isEditableTarget,
	orderWindowsForSwitcher,
	nextSwitcherIndex,
	resolveDesktopShortcut,
	resolveSwitcherKey,
} from './desktopShortcuts';
import type { WindowState } from '../types';

function makeWindow(overrides: Partial<WindowState> & { id: string }): WindowState {
	return {
		title: overrides.id,
		appId: overrides.id,
		x: 100,
		y: 100,
		width: 800,
		height: 600,
		isMaximized: false,
		isMinimized: false,
		zIndex: 100,
		isFocused: false,
		...overrides,
	};
}

describe('resolveDesktopShortcut', () => {
	const base = { altKey: true, ctrlKey: false, metaKey: false, shiftKey: false };

	it('resolves Alt+W, Alt+M, Alt+Tab, and Alt+Shift+Tab', () => {
		expect(resolveDesktopShortcut({ ...base, key: 'w' })).toBe('close');
		expect(resolveDesktopShortcut({ ...base, key: 'W' })).toBe('close');
		expect(resolveDesktopShortcut({ ...base, key: 'm' })).toBe('minimize');
		expect(resolveDesktopShortcut({ ...base, key: 'M' })).toBe('minimize');
		expect(resolveDesktopShortcut({ ...base, key: 'Tab' })).toBe('switch-next');
		expect(resolveDesktopShortcut({ ...base, key: 'Tab', shiftKey: true })).toBe('switch-prev');
	});

	it('ignores events without Alt or with Ctrl/Meta held', () => {
		expect(resolveDesktopShortcut({ ...base, altKey: false, key: 'w' })).toBeNull();
		expect(resolveDesktopShortcut({ ...base, ctrlKey: true, key: 'w' })).toBeNull();
		expect(resolveDesktopShortcut({ ...base, metaKey: true, key: 'Tab' })).toBeNull();
		expect(resolveDesktopShortcut({ ...base, ctrlKey: true, key: 'm' })).toBeNull();
	});

	it('returns null for unmapped keys', () => {
		expect(resolveDesktopShortcut({ ...base, key: 'q' })).toBeNull();
		expect(resolveDesktopShortcut({ ...base, key: 'Escape' })).toBeNull();
		expect(resolveDesktopShortcut({ ...base, key: 'Enter' })).toBeNull();
	});
});

describe('orderWindowsForSwitcher', () => {
	it('sorts windows by zIndex descending without mutating the input', () => {
		const finder = makeWindow({ id: 'finder', zIndex: 100 });
		const notes = makeWindow({ id: 'notes', zIndex: 105, isFocused: true });
		const calc = makeWindow({ id: 'calc', zIndex: 102 });
		const input = [finder, notes, calc];

		const ordered = orderWindowsForSwitcher(input);
		expect(ordered.map(w => w.id)).toEqual(['notes', 'calc', 'finder']);
		expect(input.map(w => w.id)).toEqual(['finder', 'notes', 'calc']);
	});

	it('prefers focused window when zIndex values tie', () => {
		const a = makeWindow({ id: 'a', zIndex: 100, isFocused: false });
		const b = makeWindow({ id: 'b', zIndex: 100, isFocused: true });
		expect(orderWindowsForSwitcher([a, b]).map(w => w.id)).toEqual(['b', 'a']);
	});

	it('returns an empty array for empty input', () => {
		expect(orderWindowsForSwitcher([])).toEqual([]);
	});
});

describe('nextSwitcherIndex', () => {
	it('returns -1 when total is zero or negative', () => {
		expect(nextSwitcherIndex(0, 0, false)).toBe(-1);
		expect(nextSwitcherIndex(0, -3, true)).toBe(-1);
	});

	it('wraps cleanly forward and backward', () => {
		expect(nextSwitcherIndex(0, 3, false)).toBe(1);
		expect(nextSwitcherIndex(2, 3, false)).toBe(0);
		expect(nextSwitcherIndex(0, 3, true)).toBe(2);
		expect(nextSwitcherIndex(2, 3, true)).toBe(1);
	});

	it('stays at 0 for a single item', () => {
		expect(nextSwitcherIndex(0, 1, false)).toBe(0);
		expect(nextSwitcherIndex(0, 1, true)).toBe(0);
	});
});

describe('isEditableTarget', () => {
	it('returns false for null or non-editable elements', () => {
		expect(isEditableTarget(null)).toBe(false);
		const div = {
			tagName: 'DIV',
			isContentEditable: false,
			getAttribute: () => null,
			closest: () => null,
		} as unknown as EventTarget;
		expect(isEditableTarget(div)).toBe(false);
	});

	it('detects input, textarea, and select elements', () => {
		for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) {
			const el = { tagName } as unknown as EventTarget;
			expect(isEditableTarget(el)).toBe(true);
		}
	});

	it('detects contenteditable and role=textbox directly or via closest ancestor', () => {
		const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;
		expect(isEditableTarget(editable)).toBe(true);

		const attrEditable = {
			tagName: 'DIV',
			getAttribute: (name: string) => (name === 'contenteditable' ? 'true' : null),
		} as unknown as EventTarget;
		expect(isEditableTarget(attrEditable)).toBe(true);

		const roleTextbox = {
			tagName: 'DIV',
			getAttribute: (name: string) => (name === 'role' ? 'textbox' : null),
		} as unknown as EventTarget;
		expect(isEditableTarget(roleTextbox)).toBe(true);

		const childInsideTextbox = {
			tagName: 'SPAN',
			getAttribute: () => null,
			closest: (sel: string) => (sel.includes('textbox') ? {} : null),
		} as unknown as EventTarget;
		expect(isEditableTarget(childInsideTextbox)).toBe(true);
	});
});

describe('resolveSwitcherKey and initialSwitcherIndex', () => {
	const plain = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

	it('maps Escape, Enter, arrows, and Alt+Tab variants', () => {
		expect(resolveSwitcherKey({ ...plain, key: 'Escape' })).toBe('cancel');
		expect(resolveSwitcherKey({ ...plain, key: 'Enter' })).toBe('commit');
		expect(resolveSwitcherKey({ ...plain, key: 'ArrowRight' })).toBe('next');
		expect(resolveSwitcherKey({ ...plain, key: 'ArrowLeft' })).toBe('prev');
		expect(resolveSwitcherKey({ ...plain, altKey: true, key: 'Tab' })).toBe('next');
		expect(resolveSwitcherKey({ ...plain, altKey: true, shiftKey: true, key: 'Tab' })).toBe('prev');
		expect(resolveSwitcherKey({ ...plain, key: 'a' })).toBeNull();
	});

	it('picks starting index for forward and reverse opens', () => {
		expect(initialSwitcherIndex(0, false)).toBe(-1);
		expect(initialSwitcherIndex(1, false)).toBe(0);
		expect(initialSwitcherIndex(3, false)).toBe(1);
		expect(initialSwitcherIndex(3, true)).toBe(2);
	});
});
