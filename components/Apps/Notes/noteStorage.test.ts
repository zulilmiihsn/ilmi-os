import { describe, it, expect } from 'vitest';
import { decodeNotes } from './hooks/useNotes';

describe('decodeNotes (Tahap 2)', () => {
	it('accepts an empty array as a valid empty collection', () => {
		expect(decodeNotes([])).toEqual([]);
	});

	it('normalizes ISO date strings into Dates', () => {
		const decoded = decodeNotes([
			{ id: 'a', title: 't', content: 'c', date: '2026-01-15T10:30:00.000Z', folder: 'Notes' },
		]);
		expect(decoded?.[0].date).toBeInstanceOf(Date);
		expect(decoded?.[0].date.getFullYear()).toBe(2026);
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
