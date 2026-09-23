import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { decodeEmails, loadEmails, saveEmails, SEED_EMAILS } from './utils';

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
	return storage;
}

describe('mail storage (Tahap 2)', () => {
	beforeEach(() => {
		installMemoryStorage();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('decodes valid email arrays and rejects wrong shapes', () => {
		expect(decodeEmails([])).toEqual([]);
		expect(
			decodeEmails([
				{ id: '1', from: 'a', subject: 's', preview: 'p', date: 'd', read: true, mailbox: 'inbox' },
			])
		).toHaveLength(1);
		expect(decodeEmails(null)).toBeNull();
		expect(decodeEmails([{ id: '1' }])).toBeNull();
	});

	it('falls back to seeds on corrupt or wrong-shaped payloads', () => {
		globalThis.localStorage.setItem('ilmi_mail_data_v1', '{broken');
		expect(loadEmails()).toEqual(SEED_EMAILS);
		globalThis.localStorage.setItem('ilmi_mail_data_v1', JSON.stringify({ not: 'emails' }));
		expect(loadEmails()).toEqual(SEED_EMAILS);
	});

	it('reports write failures instead of swallowing them', () => {
		vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota reached', 'QuotaExceededError');
		});
		expect(saveEmails(SEED_EMAILS)).toBe(false);
	});

	it('rejects null records and round-trips valid emails', () => {
		expect(decodeEmails([null])).toBeNull();
		expect(saveEmails(SEED_EMAILS)).toBe(true);
		expect(loadEmails()).toEqual(SEED_EMAILS);
	});

	it('falls back to seeds without a browser or stored key', () => {
		expect(loadEmails()).toEqual(SEED_EMAILS);
		const holder = globalThis as unknown as Record<string, unknown>;
		const prevWindow = holder.window;
		delete holder.window;
		try {
			expect(loadEmails()).toEqual(SEED_EMAILS);
			expect(saveEmails(SEED_EMAILS)).toBe(false);
		} finally {
			holder.window = prevWindow;
		}
	});
});
