import { describe, it, expect } from 'vitest';
import { filterDisplayEmails, getMailboxCounts } from './mailSelectors';
import { MOCK_MAILBOXES_STATIC } from './utils';
import type { Email } from './types';

const base: Email = {
	id: 'x',
	from: 'a@b.c',
	subject: 's',
	preview: 'p',
	date: '9/14/21',
	read: false,
	mailbox: 'inbox',
};

describe('mail selectors (Tahap 7)', () => {
	it('counts unread inbox and vip emails', () => {
		const emails: Email[] = [
			{ ...base, id: '1', mailbox: 'inbox', read: false },
			{ ...base, id: '2', mailbox: 'inbox', read: true },
			{ ...base, id: '3', mailbox: 'inbox', read: false, isVip: true },
		];
		const counts = Object.fromEntries(
			getMailboxCounts(MOCK_MAILBOXES_STATIC, emails).map(m => [m.id, m.count])
		);
		expect(counts.all_inboxes).toBe(2);
		expect(counts.vip).toBe(1);
	});

	it('filters by mailbox, search, and unread without mutating input', () => {
		const emails: Email[] = [
			{ ...base, id: '1', subject: 'Fun memories', mailbox: 'inbox', read: false },
			{ ...base, id: '2', subject: 'Receipt', mailbox: 'sent', read: false },
			{ ...base, id: '3', subject: 'Fun memories', mailbox: 'inbox', read: true },
		];
		const result = filterDisplayEmails(emails, {
			mailboxId: 'all_inboxes',
			searchQuery: 'fun',
			unreadOnly: true,
		});
		expect(result.map(e => e.id)).toEqual(['1']);
		expect(emails.map(e => e.id)).toEqual(['1', '2', '3']);
	});
});
