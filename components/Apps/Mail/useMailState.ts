import { useState, useEffect, useMemo } from 'react';
import { generateId } from '../../../utils/id';
import { triggerHaptic } from '../../../utils/haptic';
import { Email, MOCK_MAILBOXES_STATIC, loadEmails, saveEmails } from './index';
import { filterDisplayEmails, getMailboxCounts } from './mailSelectors';

export type ViewState = 'mailboxes' | 'list' | 'detail';

export function useMailState() {
	const [emails, setEmails] = useState<Email[]>([]);
	const [mounted, setMounted] = useState(false);
	const [selectedMailbox, setSelectedMailbox] = useState<string>('all_inboxes');
	const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
	const [isComposeOpen, setIsComposeOpen] = useState(false);
	const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['gmail']));
	const [searchQuery, setSearchQuery] = useState('');
	const [isUnreadFilterActive, setIsUnreadFilterActive] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	// Mailboxes hidden in edit mode. Best-effort UI pref (separate from the
	// validated email payload, so a corrupt value only resets visibility).
	const [hiddenMailboxes, setHiddenMailboxes] = useState<string[]>(() => {
		try {
			const raw = window.localStorage.getItem('ilmi_mail_hidden_v1');
			const parsed: unknown = raw ? JSON.parse(raw) : [];
			return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
		} catch {
			return [];
		}
	});

	useEffect(() => {
		try {
			window.localStorage.setItem('ilmi_mail_hidden_v1', JSON.stringify(hiddenMailboxes));
		} catch {
			console.warn('[Mail] failed to persist hidden mailboxes');
		}
	}, [hiddenMailboxes]);

	const toggleHiddenMailbox = (key: string) => {
		triggerHaptic('light');
		setHiddenMailboxes(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
	};

	const [selectedForAction, setSelectedForAction] = useState<Set<string>>(new Set());
	const [currentView, setCurrentView] = useState<ViewState>('mailboxes');
	const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
	const [navCount, setNavCount] = useState(0);
	const [persistError, setPersistError] = useState(false);

	// Persist emails and surface storage failures instead of silently dropping them.
	const commitEmails = (updated: Email[]): boolean => {
		setEmails(updated);
		const saved = saveEmails(updated);
		setPersistError(!saved);
		return saved;
	};

	useEffect(() => {
		setMounted(true);
		setEmails(loadEmails());
	}, []);

	useEffect(() => {
		setIsEditing(false);
		setSelectedForAction(new Set());
	}, [currentView, selectedMailbox]);

	const mailboxesWithCounts = useMemo(
		() => getMailboxCounts(MOCK_MAILBOXES_STATIC, emails),
		[emails]
	);

	const displayEmails = useMemo(
		() =>
			filterDisplayEmails(emails, {
				mailboxId: selectedMailbox,
				searchQuery,
				unreadOnly: isUnreadFilterActive,
			}),
		[emails, selectedMailbox, searchQuery, isUnreadFilterActive]
	);

	const toggleAccount = (id: string) => {
		triggerHaptic('light');
		const newSet = new Set(expandedAccounts);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		setExpandedAccounts(newSet);
	};

	const navigateToMailbox = (mailboxId: string) => {
		triggerHaptic('light');
		setDirection('forward');
		setNavCount(c => c + 1);
		setSelectedMailbox(mailboxId);
		setCurrentView('list');
		setIsUnreadFilterActive(false);
	};

	const navigateToEmail = (emailId: string) => {
		triggerHaptic('light');
		if (isEditing) {
			const newSet = new Set(selectedForAction);
			if (newSet.has(emailId)) newSet.delete(emailId);
			else newSet.add(emailId);
			setSelectedForAction(newSet);
			return;
		}

		setDirection('forward');
		setNavCount(c => c + 1);
		setSelectedEmailId(emailId);
		setCurrentView('detail');

		const updatedEmails = emails.map(e => (e.id === emailId ? { ...e, read: true } : e));
		commitEmails(updatedEmails);
	};

	const handleBack = () => {
		triggerHaptic('light');
		setDirection('backward');
		setNavCount(c => c + 1);
		if (currentView === 'detail') {
			setCurrentView('list');
			setSelectedEmailId(null);
		} else if (currentView === 'list') {
			setCurrentView('mailboxes');
			setSelectedMailbox('all_inboxes');
		}
	};

	const handleSendEmail = (to: string, subject: string, body: string): boolean => {
		triggerHaptic('medium');
		const newEmail: Email = {
			id: generateId('email'),
			from: 'Me',
			to,
			subject,
			preview: body,
			date: new Date().toLocaleDateString('en-US', {
				month: 'numeric',
				day: 'numeric',
				year: '2-digit',
			}),
			read: true,
			mailbox: 'sent',
		};

		let updatedEmails = [newEmail, ...emails];
		if (to.toLowerCase().includes('me') || to.toLowerCase().includes('icloud')) {
			const inboxCopy: Email = {
				...newEmail,
				id: generateId('email'),
				from: 'Me',
				mailbox: 'inbox',
				read: false,
			};
			updatedEmails = [inboxCopy, ...updatedEmails];
		}

		if (!commitEmails(updatedEmails)) return false;
		setIsComposeOpen(false);
		return true;
	};

	const handleDeleteEmail = (id: string) => {
		const target = emails.find(e => e.id === id);
		if (!target) return;

		const updatedEmails =
			target.mailbox === 'trash'
				? emails.filter(e => e.id !== id)
				: emails.map(e => (e.id === id ? { ...e, mailbox: 'trash' } : e));
		commitEmails(updatedEmails);

		if (currentView === 'detail') handleBack();
	};

	const handleArchiveEmail = (id: string) => {
		const updatedEmails = emails.map(e => (e.id === id ? { ...e, mailbox: 'archive' } : e));
		commitEmails(updatedEmails);
		if (currentView === 'detail') handleBack();
	};

	const handleBatchDelete = () => {
		if (selectedForAction.size === 0) return;
		triggerHaptic('medium');

		let updatedEmails = [...emails];
		selectedForAction.forEach(id => {
			const target = updatedEmails.find(e => e.id === id);
			if (target) {
				if (target.mailbox === 'trash') {
					updatedEmails = updatedEmails.filter(e => e.id !== id);
				} else {
					updatedEmails = updatedEmails.map(e => (e.id === id ? { ...e, mailbox: 'trash' } : e));
				}
			}
		});

		commitEmails(updatedEmails);
		setIsEditing(false);
		setSelectedForAction(new Set());
	};

	const handleBatchArchive = () => {
		if (selectedForAction.size === 0) return;
		triggerHaptic('light');

		const updatedEmails = emails.map(e =>
			selectedForAction.has(e.id) ? { ...e, mailbox: 'archive' } : e
		);
		commitEmails(updatedEmails);
		setIsEditing(false);
		setSelectedForAction(new Set());
	};

	const handleReply = () => {
		const currentEmail = emails.find(e => e.id === selectedEmailId);
		if (currentEmail) {
			setIsComposeOpen(true);
		}
	};

	const toggleEditMode = () => {
		triggerHaptic('light');
		if (isEditing) {
			setIsEditing(false);
			setSelectedForAction(new Set());
		} else {
			setIsEditing(true);
		}
	};

	const animationClass =
		navCount === 0
			? ''
			: `animate-in duration-200 md:animate-none ${direction === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'}`;

	return {
		emails,
		mounted,
		selectedMailbox,
		selectedEmailId,
		isComposeOpen,
		setIsComposeOpen,
		expandedAccounts,
		searchQuery,
		setSearchQuery,
		isUnreadFilterActive,
		setIsUnreadFilterActive,
		isEditing,
		hiddenMailboxes,
		toggleHiddenMailbox,
		selectedForAction,
		currentView,
		persistError,
		mailboxesWithCounts,
		displayEmails,
		toggleAccount,
		navigateToMailbox,
		navigateToEmail,
		handleBack,
		handleSendEmail,
		handleDeleteEmail,
		handleArchiveEmail,
		handleBatchDelete,
		handleBatchArchive,
		handleReply,
		toggleEditMode,
		animationClass,
	};
}
