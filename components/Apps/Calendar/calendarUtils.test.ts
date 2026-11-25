import { describe, it, expect } from 'vitest';
import {
	decodeCalendarEvents,
	getDefaultCalendarEvents,
	resolveInitialCalendarEvents,
} from './calendarUtils';

describe('calendarUtils storage helpers', () => {
	it('accepts an empty array as a valid empty collection', () => {
		expect(decodeCalendarEvents([])).toEqual([]);
	});

	it('rejects malformed payloads and invalid entries', () => {
		expect(decodeCalendarEvents(null)).toBeNull();
		expect(decodeCalendarEvents({})).toBeNull();
		expect(decodeCalendarEvents([{ date: 'bad', title: 'X' }])).toBeNull();
		expect(decodeCalendarEvents([{ date: '2026-12-25', title: '   ' }])).toBeNull();
	});

	it('distinguishes absent, valid-empty, and corrupted storage', () => {
		const defaults = getDefaultCalendarEvents(new Date('2026-06-01T12:00:00Z'));

		const absent = resolveInitialCalendarEvents(null, false, defaults);
		expect(absent.events).toEqual(defaults);
		expect(absent.skipInitialSave).toBe(false);

		const empty = resolveInitialCalendarEvents([], true, defaults);
		expect(empty.events).toEqual([]);
		expect(empty.skipInitialSave).toBe(false);

		const corrupted = resolveInitialCalendarEvents({ bad: true }, true, defaults);
		expect(corrupted.events).toEqual(defaults);
		expect(corrupted.skipInitialSave).toBe(true);
	});
});
