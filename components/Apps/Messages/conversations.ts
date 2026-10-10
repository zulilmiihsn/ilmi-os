import { generateId } from '../../../utils/id';

export interface ChatMessage {
	id: string;
	fromMe: boolean;
	text: string;
	sentAt: string; // ISO timestamp
}

export interface Conversation {
	id: string;
	name: string;
	messages: ChatMessage[];
	read: boolean;
}

export const MESSAGES_KEY = 'ilmi_messages_v1';

const msg = (fromMe: boolean, text: string, sentAt: string): ChatMessage => ({
	id: generateId('msg'),
	fromMe,
	text,
	sentAt,
});

export const SEED_CONVERSATIONS: Conversation[] = [
	{
		id: 'ilham',
		name: 'Ilham',
		read: false,
		messages: [
			msg(false, 'Bro, jadi nongkrong sabtu?', '2026-09-22T09:12:00.000Z'),
			msg(false, 'Di kopi kenangan aja gimana', '2026-09-22T09:13:00.000Z'),
			msg(true, 'Jadi. Jam 4 ya', '2026-09-22T09:20:00.000Z'),
		],
	},
	{
		id: 'samarinda-fam',
		name: 'Keluarga Samarinda',
		read: true,
		messages: [
			msg(false, 'Jangan lupa bawa oleh-oleh amplang', '2026-09-20T18:02:00.000Z'),
			msg(true, 'Siap, sudah masuk list', '2026-09-20T18:15:00.000Z'),
		],
	},
	{
		id: 'kurir',
		name: 'Kurir Paket',
		read: true,
		messages: [
			msg(false, 'Paket sudah sampai di pos satpam ya pak', '2026-09-18T11:05:00.000Z'),
		],
	},
];

export function isValidConversations(data: unknown): data is Conversation[] {
	return (
		Array.isArray(data) &&
		data.every(
			c =>
				typeof c === 'object' &&
				c !== null &&
				typeof (c as { id?: unknown }).id === 'string' &&
				typeof (c as { name?: unknown }).name === 'string' &&
				typeof (c as { read?: unknown }).read === 'boolean' &&
				Array.isArray((c as { messages?: unknown }).messages) &&
				((c as { messages?: unknown }).messages as unknown[]).every(
					m =>
						typeof m === 'object' &&
						m !== null &&
						typeof (m as { id?: unknown }).id === 'string' &&
						typeof (m as { fromMe?: unknown }).fromMe === 'boolean' &&
						typeof (m as { text?: unknown }).text === 'string' &&
						typeof (m as { sentAt?: unknown }).sentAt === 'string'
				)
		)
	);
}

/** Invalid payloads render seeds without touching storage. */
export function loadConversations(): Conversation[] {
	if (typeof window === 'undefined') return SEED_CONVERSATIONS;
	try {
		const raw = window.localStorage.getItem(MESSAGES_KEY);
		if (!raw) return SEED_CONVERSATIONS;
		const parsed: unknown = JSON.parse(raw);
		if (!isValidConversations(parsed)) {
			console.warn('[Messages] stored data failed validation, using seeds');
			return SEED_CONVERSATIONS;
		}
		return parsed;
	} catch (error) {
		console.warn('[Messages] failed to load conversations, using seeds', error);
		return SEED_CONVERSATIONS;
	}
}

/** Returns true when the conversations were actually persisted. */
export function saveConversations(convos: Conversation[]): boolean {
	if (typeof window === 'undefined') return false;
	try {
		window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(convos));
		return true;
	} catch (error) {
		console.warn('[Messages] failed to save conversations', error);
		return false;
	}
}

/** Appends a message I sent (marks the thread read). Pure and testable. */
export function addMessage(
	convos: Conversation[],
	convoId: string,
	text: string,
	sentAt = new Date().toISOString()
): Conversation[] {
	const body = text.trim();
	if (!body) return convos;
	return convos.map(c =>
		c.id === convoId
			? { ...c, read: true, messages: [...c.messages, { id: generateId('msg'), fromMe: true, text: body, sentAt }] }
			: c
	);
}

/** Starts a thread with the first message. Pure and testable. */
export function createConversation(convos: Conversation[], name: string, text: string): Conversation[] {
	const target = name.trim();
	const body = text.trim();
	if (!target || !body) return convos;
	const now = new Date().toISOString();
	return [
		{
			id: generateId('convo'),
			name: target,
			read: true,
			messages: [{ id: generateId('msg'), fromMe: true, text: body, sentAt: now }],
		},
		...convos,
	];
}

/** Marks a thread read. Pure and testable. */
export function markRead(convos: Conversation[], convoId: string): Conversation[] {
	return convos.map(c => (c.id === convoId ? { ...c, read: true } : c));
}

/** Latest message of a thread, if any. */
export function lastMessage(convo: Conversation): ChatMessage | null {
	return convo.messages.length > 0 ? (convo.messages[convo.messages.length - 1] ?? null) : null;
}

/** Filters threads by contact name or message text. Pure and testable. */
export function filterConversations(convos: Conversation[], query: string): Conversation[] {
	const q = query.trim().toLowerCase();
	if (!q) return convos;
	return convos.filter(
		c =>
			c.name.toLowerCase().includes(q) ||
			c.messages.some(m => m.text.toLowerCase().includes(q))
	);
}

/** "9:41 AM" today, "Yesterday", else M/D/YY. Never NaN. */
export function formatMessageTime(iso: string, now = new Date()): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const dayKey = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
	const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	if (dayKey(d) === dayKey(now)) return time;
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (dayKey(d) === dayKey(yesterday)) return `Yesterday ${time}`;
	return `${d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })} ${time}`;
}

/** Day divider label: "Today", "Yesterday", else "Sep 22, 2026". */
export function formatDayLabel(iso: string, now = new Date()): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const dayKey = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
	if (dayKey(d) === dayKey(now)) return 'Today';
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
	return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Initials for the gray avatar circle. */
export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return (parts[0]?.charAt(0) ?? '?').toUpperCase();
	return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
}
