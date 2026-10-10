import type { Email, Mailbox } from './types';

export type MailboxWithCount = Mailbox & { count?: number };

/** Unread counts for smart mailboxes; account rows stay at zero. Pure and testable. */
export function getMailboxCounts(mailboxes: Mailbox[], emails: Email[]): MailboxWithCount[] {
	return mailboxes.map(box => {
		if (box.id === 'all_inboxes') {
			return { ...box, count: emails.filter(e => e.mailbox === 'inbox' && !e.read).length };
		}
		if (box.id === 'vip') {
			return { ...box, count: emails.filter(e => e.isVip && !e.read).length };
		}
		if (box.type === 'account') {
			return { ...box, count: 0 };
		}
		return box;
	});
}

export interface MailFilter {
	mailboxId: string;
	searchQuery: string;
	unreadOnly: boolean;
}

/** Robust timestamp for seed dates like M/D/YY. Unparseable sorts last, never NaN. */
export function parseMailDate(date: string): number {
	const direct = new Date(date).getTime();
	if (!Number.isNaN(direct)) return direct;
	const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(date.trim());
	if (m) {
		const month = Number(m[1]);
		const day = Number(m[2]);
		const rawYear = m[3] ?? '';
		const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
		const parsed = new Date(year, month - 1, day).getTime();
		if (!Number.isNaN(parsed)) return parsed;
	}
	return 0;
}

/** Mailbox, search, unread, and date-desc ordering. Never mutates the input array. */
export function filterDisplayEmails(emails: Email[], filter: MailFilter): Email[] {
	let filtered = emails;

	if (filter.mailboxId === 'all_inboxes') {
		filtered = filtered.filter(e => e.mailbox === 'inbox');
	} else if (filter.mailboxId === 'vip') {
		filtered = filtered.filter(e => e.isVip);
	} else {
		filtered = filtered.filter(e => e.mailbox === filter.mailboxId);
	}

	if (filter.searchQuery) {
		const q = filter.searchQuery.toLowerCase();
		filtered = filtered.filter(
			e =>
				e.from.toLowerCase().includes(q) ||
				e.subject.toLowerCase().includes(q) ||
				e.preview.toLowerCase().includes(q)
		);
	}

	if (filter.unreadOnly) {
		filtered = filtered.filter(e => !e.read);
	}

	return [...filtered].sort((a, b) => parseMailDate(b.date) - parseMailDate(a.date));
}
