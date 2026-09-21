import { describe, it, expect } from 'vitest';
import { REGISTERED_COMPONENT_NAMES, isValidComponentName } from './componentNames';

describe('component name registry (Tahap 1)', () => {
	it('accepts registered components', () => {
		expect(REGISTERED_COMPONENT_NAMES).toContain('Notes');
		expect(REGISTERED_COMPONENT_NAMES).toContain('Terminal');
		expect(isValidComponentName('Notes')).toBe(true);
		expect(isValidComponentName('Terminal')).toBe(true);
	});

	it('rejects placeholders and unknown names', () => {
		expect(REGISTERED_COMPONENT_NAMES).not.toContain('placeholder');
		expect(isValidComponentName('placeholder')).toBe(false);
		expect(isValidComponentName('no-such-app')).toBe(false);
		expect(isValidComponentName('')).toBe(false);
	});

	it('rejects inherited prototype names', () => {
		expect(isValidComponentName('toString')).toBe(false);
		expect(isValidComponentName('constructor')).toBe(false);
		expect(isValidComponentName('__proto__')).toBe(false);
		expect(isValidComponentName('hasOwnProperty')).toBe(false);
	});
});
