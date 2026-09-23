import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeNotes, readLegacyNotes, resolveInitialNotes } from './hooks/useNotes';

function installMemoryStorage() {
	const storage = new Map<string, string>();
	globalThis.localStorage = {
		getItem: (key: string) => storage.get(key) || null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
		clear: () => storage.clear(),
		key: (index: number) => Array.from(storage.keys())[index] || null,
		length: storage.size,
	} as unknown as Storage;
	(globalThis as unknown as { window: unknown }).window = globalThis;
}

describe('decodeNotes (Tahap 2)', () => {
	it('accepts an empty array as a valid empty collection', () => {
		expect(decodeNotes([])).toEqual([]);
	});

	it('normalizes ISO date strings into Dates', () => {
		const decoded = decodeNotes([
			{ id: 'a', title: 't', content: 'c', date: '2026-01-15T10:30:00.000Z', folder: 'Notes' },
		]);
		expect(decoded?.[0]?.date).toBeInstanceOf(Date);
		expect(decoded?.[0]?.date.getFullYear()).toBe(2026);
	});

	it('rejects non-array payloads', () => {
		expect(decodeNotes(null)).toBeNull();
		expect(decodeNotes({})).toBeNull();
		expect(decodeNotes('notes')).toBeNull();
	});

	it('rejects records with missing ids or invalid dates', () => {
		expect(decodeNotes([{ title: 'no id', date: '2026-01-01' }])).toBeNull();
		expect(decodeNotes([{ id: 'a', date: 'not-a-date' }])).toBeNull();
		expect(decodeNotes([null])).toBeNull();
	});

	it('fills safe defaults for optional fields', () => {
		const decoded = decodeNotes([{ id: 'a', date: '2026-01-01T00:00:00.000Z' }]);
		expect(decoded?.[0]).toMatchObject({
			title: '',
			content: '',
			folder: 'Notes',
			selected: false,
		});
	});
});

const storedNote = {
	id: 'a',
	title: 't',
	content: 'c',
	date: '2026-01-15T10:30:00.000Z',
	folder: 'Notes',
};

describe('resolveInitialNotes (Tahap 2 hook logic)', () => {
	it('uses a valid destination as-is, including an empty collection', () => {
		const readLegacy = vi.fn();
		for (const stored of [[storedNote], []]) {
			const result = resolveInitialNotes({
				stored,
				destinationPresent: true,
				readLegacy,
				save: vi.fn(),
				loadVerify: vi.fn(),
			});
			expect(result.notes).toHaveLength((stored as unknown[]).length);
			expect(result.skipInitialSave).toBe(false);
			expect(result.removeLegacy).toBe(false);
		}
		expect(readLegacy).not.toHaveBeenCalled();
	});

	it('preserves an invalid-but-present destination while rendering defaults', () => {
		const result = resolveInitialNotes({
			stored: { not: 'notes' },
			destinationPresent: true,
			readLegacy: vi.fn(),
			save: vi.fn(),
			loadVerify: vi.fn(),
		});
		expect(result.notes.map(n => n.title)).toContain('Welcome to iLmi Notes 📝');
		expect(result.skipInitialSave).toBe(true);
		expect(result.removeLegacy).toBe(false);
	});

	it('removes the legacy source only after a verified migration write', () => {
		const save = vi.fn().mockReturnValue(true);
		const result = resolveInitialNotes({
			stored: null,
			destinationPresent: false,
			readLegacy: () => decodeNotes([storedNote]),
			save,
			loadVerify: () => [{ ...storedNote }],
		});
		expect(result.notes.map(n => n.id)).toEqual(['a']);
		expect(save).toHaveBeenCalledTimes(1);
		expect(result.skipInitialSave).toBe(false);
		expect(result.removeLegacy).toBe(true);
	});

	it('keeps the legacy source and skips autosave when the migration write fails', () => {
		const save = vi.fn().mockReturnValue(false);
		const result = resolveInitialNotes({
			stored: null,
			destinationPresent: false,
			readLegacy: () => decodeNotes([storedNote]),
			save,
			loadVerify: () => null,
		});
		expect(result.notes.map(n => n.id)).toEqual(['a']);
		expect(result.skipInitialSave).toBe(true);
		expect(result.removeLegacy).toBe(false);
	});

	it('keeps the legacy source when verification itself throws', () => {
		const result = resolveInitialNotes({
			stored: null,
			destinationPresent: false,
			readLegacy: () => decodeNotes([storedNote]),
			save: vi.fn(),
			loadVerify: () => {
				throw new Error('denied');
			},
		});
		expect(result.notes.map(n => n.id)).toEqual(['a']);
		expect(result.skipInitialSave).toBe(true);
		expect(result.removeLegacy).toBe(false);
	});

	it('falls back to defaults when no legacy data exists', () => {
		const result = resolveInitialNotes({
			stored: null,
			destinationPresent: false,
			readLegacy: () => null,
			save: vi.fn(),
			loadVerify: vi.fn(),
		});
		expect(result.notes.map(n => n.title)).toContain('Welcome to iLmi Notes 📝');
		expect(result.skipInitialSave).toBe(false);
		expect(result.removeLegacy).toBe(false);
	});
});

describe('readLegacyNotes (Tahap 6)', () => {
	beforeEach(() => {
		installMemoryStorage();
	});

	it('decodes the pre-v1 raw array without touching the new key', () => {
		globalThis.localStorage.setItem(
			'notes',
			JSON.stringify([{ id: 'old', date: '2026-01-01T00:00:00.000Z' }])
		);
		expect(readLegacyNotes()?.map(n => n.id)).toEqual(['old']);
		expect(globalThis.localStorage.getItem('ilmi:notes:v1')).toBeNull();
	});

	it('returns null for absent, corrupt, or denied legacy storage', () => {
		expect(readLegacyNotes()).toBeNull();
		globalThis.localStorage.setItem('notes', '{broken');
		expect(readLegacyNotes()).toBeNull();
		const browser = {};
		Object.defineProperty(browser, 'localStorage', {
			get() {
				throw new DOMException('Denied', 'SecurityError');
			},
		});
		vi.stubGlobal('window', browser);
		expect(readLegacyNotes()).toBeNull();
		vi.unstubAllGlobals();
	});
});
