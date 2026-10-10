import { describe, it, expect } from 'vitest';
import {
	addCallLog,
	addFavorite,
	removeFavorite,
	formatCallDuration,
	formatCallTime,
	isValidCallLog,
	isValidFavorites,
	type CallLogEntry,
} from './recents';

const entry = (over: Partial<CallLogEntry> = {}): CallLogEntry => ({
	id: 'call_1',
	number: '555-0100',
	startedAt: '2026-09-22T09:41:00.000Z',
	durationSec: 65,
	...over,
});

describe('phone recents', () => {
	it('validates stored payloads', () => {
		expect(isValidCallLog([entry()])).toBe(true);
		expect(isValidCallLog([{ ...entry(), durationSec: '65' }])).toBe(false);
		expect(isValidCallLog({})).toBe(false);
		expect(isValidCallLog(null)).toBe(false);
	});

	it('prepends newest first and caps the log', () => {
		const log = addCallLog([entry({ id: 'old' })], {
			number: '555-0200',
			startedAt: '2026-09-23T10:00:00.000Z',
			durationSec: 5,
		});
		expect(log.map(e => e.number)).toEqual(['555-0200', '555-0100']);
		expect(log[0]?.id).not.toBe('old');

		const full = Array.from({ length: 60 }, (_, i) => entry({ id: `c${i}` }));
		expect(addCallLog(full, { number: 'x', startedAt: full[0]?.startedAt ?? '', durationSec: 1 })).toHaveLength(
			50
		);
	});

	it('formats call times relatively', () => {
		const now = new Date('2026-09-22T12:00:00');
		expect(formatCallTime('2026-09-22T09:41:00', now)).toBe(
			new Date('2026-09-22T09:41:00').toLocaleTimeString([], {
				hour: 'numeric',
				minute: '2-digit',
			})
		);
		expect(formatCallTime('2026-09-21T09:41:00', now)).toBe('Yesterday');
		expect(formatCallTime('2026-09-10T09:41:00', now)).toBe(
			new Date('2026-09-10T09:41:00').toLocaleDateString([], {
				month: 'numeric',
				day: 'numeric',
				year: '2-digit',
			})
		);
		expect(formatCallTime('garbage', now)).toBe('');
	});

	it('formats durations as m:ss', () => {
		expect(formatCallDuration(65)).toBe('1:05');
		expect(formatCallDuration(7)).toBe('0:07');
		expect(formatCallDuration(-3)).toBe('0:00');
	});

	it('manages favorites without duplicates', () => {
		expect(isValidFavorites([{ number: '1', addedAt: 'x' }])).toBe(true);
		expect(isValidFavorites([{ number: 1 }])).toBe(false);
		const one = addFavorite([], '555-0100', '2026-09-22T10:00:00.000Z');
		expect(one).toHaveLength(1);
		expect(addFavorite(one, '555-0100')).toHaveLength(1);
		expect(addFavorite(one, '   ')).toHaveLength(1);
		expect(removeFavorite(addFavorite(one, '555-0200'), '555-0100').map(e => e.number)).toEqual([
			'555-0200',
		]);
	});
});
