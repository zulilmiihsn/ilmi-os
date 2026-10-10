import { describe, it, expect } from 'vitest';
import {
	addMessage,
	createConversation,
	filterConversations,
	formatDayLabel,
	formatMessageTime,
	initials,
	isValidConversations,
	lastMessage,
	markRead,
	type Conversation,
} from './conversations';

const convo = (over: Partial<Conversation> = {}): Conversation => ({
	id: 'c1',
	name: 'Ilham',
	read: false,
	messages: [
		{ id: 'm1', fromMe: false, text: 'halo', sentAt: '2026-09-22T09:12:00.000Z' },
		{ id: 'm2', fromMe: true, text: 'halo juga', sentAt: '2026-09-22T09:20:00.000Z' },
	],
	...over,
});

describe('messages store helpers', () => {
	it('validates stored payloads', () => {
		expect(isValidConversations([convo()])).toBe(true);
		expect(isValidConversations([{ ...convo(), read: 'yes' }])).toBe(false);
		expect(isValidConversations(null)).toBe(false);
	});

	it('appends sent messages and marks read', () => {
		const next = addMessage([convo()], 'c1', '  oke  ');
		expect(next[0]?.messages).toHaveLength(3);
		expect(next[0]?.messages[2]).toMatchObject({ fromMe: true, text: 'oke' });
		expect(next[0]?.read).toBe(true);
		expect(addMessage([convo()], 'c1', '   ')).toHaveLength(1);
		expect(addMessage([convo()], 'nope', 'hi')[0]?.messages).toHaveLength(2);
	});

	it('creates threads with the first message', () => {
		const next = createConversation([], '  555-01  ', 'hello');
		expect(next).toHaveLength(1);
		expect(next[0]).toMatchObject({ name: '555-01', read: true });
		expect(next[0]?.messages).toHaveLength(1);
		expect(createConversation([], '', 'hi')).toHaveLength(0);
		expect(createConversation([], 'x', '')).toHaveLength(0);
	});

	it('marks threads read and reads last messages', () => {
		expect(markRead([convo()], 'c1')[0]?.read).toBe(true);
		expect(lastMessage(convo())?.id).toBe('m2');
		expect(lastMessage(convo({ messages: [] }))).toBeNull();
	});

	it('filters by name or text', () => {
		const convos = [convo({ id: 'a', name: 'Ilham' }), convo({ id: 'b', name: 'Kurir' })];
		expect(filterConversations(convos, '').map(c => c.id)).toEqual(['a', 'b']);
		expect(filterConversations(convos, 'kur').map(c => c.id)).toEqual(['b']);
		expect(filterConversations(convos, 'HALO').map(c => c.id)).toEqual(['a', 'b']);
		expect(filterConversations(convos, 'zzz')).toHaveLength(0);
	});

	it('formats times relatively without NaN', () => {
		const now = new Date('2026-09-22T12:00:00');
		const timeOpts = { hour: 'numeric', minute: '2-digit' } as const;
		expect(formatMessageTime('2026-09-22T09:41:00', now)).toBe(
			new Date('2026-09-22T09:41:00').toLocaleTimeString([], timeOpts)
		);
		expect(formatMessageTime('2026-09-21T09:41:00', now)).toContain('Yesterday');
		expect(formatMessageTime('garbage', now)).toBe('');
		expect(formatDayLabel('2026-09-22T09:41:00', now)).toBe('Today');
		expect(formatDayLabel('2026-09-21T09:41:00', now)).toBe('Yesterday');
		expect(formatDayLabel('2026-09-10T09:41:00', now)).toBe(
			new Date('2026-09-10T09:41:00').toLocaleDateString([], {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		);
	});

	it('derives avatar initials', () => {
		expect(initials('Ilham Maulana')).toBe('IM');
		expect(initials('kurir')).toBe('K');
		expect(initials('  ')).toBe('?');
	});
});
