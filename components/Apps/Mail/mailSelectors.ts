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

	return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
