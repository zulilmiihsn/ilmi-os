import { describe, it, expect } from 'vitest';
import {
	currentUrl,
	displayHost,
	navigateTab,
	newTab,
	normalizeUrl,
	recordVisit,
	toggleBookmark,
} from './browsing';

describe('safari browsing helpers', () => {
	it('normalizes addresses and searches', () => {
		expect(normalizeUrl('  apple.com  ')).toBe('https://apple.com');
		expect(normalizeUrl('http://x.id/a?b=1')).toBe('http://x.id/a?b=1');
		expect(normalizeUrl('cara masak nasi')).toBe(
			'https://duckduckgo.com/?q=cara%20masak%20nasi'
		);
		expect(normalizeUrl('   ')).toBeNull();
	});

	it('reads hostnames safely', () => {
		expect(displayHost('https://www.apple.com/id/')).toBe('apple.com');
		expect(displayHost('not a url')).toBe('not a url');
	});

	it('pushes navigations and drops forward history', () => {
		const t0 = { ...newTab(), id: 't' };
		const t1 = navigateTab(t0, 'https://a.com');
		expect(currentUrl(t1)).toBe('https://a.com');
		const t2 = navigateTab({ ...t1, hi: 0 }, 'https://b.com');
		expect(t2.history).toEqual(['https://a.com', 'https://b.com']);
		expect(currentUrl({ ...t2, hi: 0 })).toBe('https://a.com');
		expect(currentUrl(t0)).toBeNull();
	});

	it('records visits deduped and capped', () => {
		const one = recordVisit([], 'https://a.com', '2026-09-22T10:00:00.000Z');
		expect(recordVisit(one, 'https://a.com')).toHaveLength(1);
		const full = Array.from({ length: 60 }, (_, i) => ({
			url: `https://s${i}.com`,
			at: '2026-09-22T10:00:00.000Z',
		}));
		expect(recordVisit(full, 'https://new.com')).toHaveLength(50);
	});

	it('toggles bookmarks', () => {
		expect(toggleBookmark([], 'https://a.com')).toEqual(['https://a.com']);
		expect(toggleBookmark(['https://a.com'], 'https://a.com')).toEqual([]);
	});
});
