import { describe, it, expect } from 'vitest';
import { isIosApp, isMacosApp, type AppMetadata } from './index';

const app = (platform: AppMetadata['platform']): AppMetadata => ({
	id: 'x',
	name: 'X',
	icon: 'x',
	component: 'Notes',
	platform,
});

describe('platform predicates', () => {
	it('routes both-shell apps to each shell and exclusive apps to one', () => {
		expect(isIosApp(app('both'))).toBe(true);
		expect(isMacosApp(app('both'))).toBe(true);
		expect(isIosApp(app('ios'))).toBe(true);
		expect(isMacosApp(app('ios'))).toBe(false);
		expect(isIosApp(app('macos'))).toBe(false);
		expect(isMacosApp(app('macos'))).toBe(true);
	});
});
