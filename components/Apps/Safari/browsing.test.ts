import { describe, it, expect } from 'vitest';
import {
	currentUrl,
	displayHost,
	extractSearchQuery,
	isLikelyFrameBlocked,
	navigateTab,
	newTab,
	normalizeUrl,
	parseWikiSearchResults,
	recordVisit,
	toggleBookmark,
} from './browsing';

describe('safari browsing helpers', () => {
	it('normalizes addresses and searches', () => {
		expect(normalizeUrl('  apple.com  ')).toBe('https://apple.com');
		expect(normalizeUrl('http://x.id/a?b=1')).toBe('http://x.id/a?b=1');
		expect(normalizeUrl('cara masak nasi')).toBe('https://duckduckgo.com/?q=cara%20masak%20nasi');
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

	it('extracts search queries and flags frame-blocked hosts', () => {
		expect(extractSearchQuery('https://duckduckgo.com/?q=apple%20macos')).toBe('apple macos');
		expect(extractSearchQuery('https://example.com')).toBeNull();
		expect(isLikelyFrameBlocked('https://www.apple.com/mac')).toBe(true);
		expect(isLikelyFrameBlocked('https://github.com/org/repo')).toBe(true);
		expect(isLikelyFrameBlocked('https://en.wikipedia.org/wiki/MacOS')).toBe(false);
	});

	it('parses Wikipedia search responses cleanly without HTML tags', () => {
		const items = parseWikiSearchResults({
			query: {
				search: [
					{
						pageid: 1,
						title: 'MacOS',
						snippet: '<span class="searchmatch">macOS</span> &amp; &quot;Apple&quot;',
					},
					{ pageid: 0, title: '' },
				],
			},
		});
		expect(items).toEqual([
			{
				pageId: 1,
				title: 'MacOS',
				snippet: 'macOS & "Apple"',
				url: 'https://en.wikipedia.org/wiki/MacOS',
			},
		]);
		expect(parseWikiSearchResults(undefined)).toEqual([]);
	});
});
