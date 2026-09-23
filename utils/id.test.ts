import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateId } from './id';

describe('generateId (Tahap 6)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('prefixes ids and keeps them unique', () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId('note')));
		expect(ids.size).toBe(100);
		for (const id of ids) {
			expect(id.startsWith('note-')).toBe(true);
		}
		expect(generateId()).toMatch(/^id-/);
	});

	it('prefers crypto.randomUUID when available', () => {
		vi.stubGlobal('crypto', { randomUUID: () => 'fixed-uuid' });
		expect(generateId('folder')).toBe('folder-fixed-uuid');
	});

	it('falls back to timestamp randomness without randomUUID', () => {
		vi.stubGlobal('crypto', undefined);
		const id = generateId('file');
		expect(id.startsWith('file-')).toBe(true);
		expect(new Set([generateId('a'), generateId('b')]).size).toBe(2);
	});

	it('uses getRandomValues when randomUUID is missing', () => {
		const realCrypto = globalThis.crypto;
		vi.stubGlobal('crypto', { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) });
		const id = generateId('photo');
		expect(id.startsWith('photo-')).toBe(true);
		expect(id.length).toBeGreaterThan('photo-'.length);
	});
});
