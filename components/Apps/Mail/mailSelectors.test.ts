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

	it('filters vip and specific mailboxes with date-desc ordering', () => {
		const emails: Email[] = [
			{ ...base, id: '1', mailbox: 'inbox', date: '9/14/21', isVip: true },
			{ ...base, id: '2', mailbox: 'inbox', date: '9/16/21', isVip: true },
			{ ...base, id: '3', mailbox: 'sent', date: '9/15/21' },
		];
		const vip = filterDisplayEmails(emails, { mailboxId: 'vip', searchQuery: '', unreadOnly: false });
		expect(vip.map(e => e.id)).toEqual(['2', '1']);
		const sent = filterDisplayEmails(emails, {
			mailboxId: 'sent',
			searchQuery: '',
			unreadOnly: false,
		});
		expect(sent.map(e => e.id)).toEqual(['3']);
		// Input order untouched: the sort copies instead of mutating.
		expect(emails.map(e => e.id)).toEqual(['1', '2', '3']);
	});

	it('matches search text in preview bodies too', () => {
		const emails: Email[] = [
			{ ...base, id: '1', subject: 'Hello', preview: 'quarterly report attached' },
			{ ...base, id: '2', subject: 'Hello', preview: 'see you soon' },
		];
		const result = filterDisplayEmails(emails, {
			mailboxId: 'all_inboxes',
			searchQuery: 'quarterly',
			unreadOnly: false,
		});
		expect(result.map(e => e.id)).toEqual(['1']);
	});
});
