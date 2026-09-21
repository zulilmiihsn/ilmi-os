'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import { generateId } from '../../../utils/id';
import { triggerHaptic } from '../../../utils/haptic';
import {
	Email,
	ACCOUNT_FOLDERS,
	MOCK_MAILBOXES_STATIC,
	loadEmails,
	saveEmails,
	MailboxItem,
	SwipeableEmailItem,
	ComposeModal,
	EmailDetail,
} from './index';
import { filterDisplayEmails, getMailboxCounts } from './mailSelectors';

// --- Main App Component ---

type ViewState = 'mailboxes' | 'list' | 'detail';

export default function Mail() {
	const { darkMode } = useSettingsStore();

	// State
	const [emails, setEmails] = useState<Email[]>([]);
	const [mounted, setMounted] = useState(false);
	const [selectedMailbox, setSelectedMailbox] = useState<string>('all_inboxes');
	const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
	const [isComposeOpen, setIsComposeOpen] = useState(false);
	const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['gmail']));
	const [searchQuery, setSearchQuery] = useState('');
	const [isUnreadFilterActive, setIsUnreadFilterActive] = useState(false);

	// Edit Mode State
	const [isEditing, setIsEditing] = useState(false);
	const [selectedForAction, setSelectedForAction] = useState<Set<string>>(new Set());

	// Navigation State for Mobile
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

	// Load data on mount
	useEffect(() => {
		setMounted(true);
		setEmails(loadEmails());
	}, []);

	// Reset edit mode on view change
	useEffect(() => {
		setIsEditing(false);
		setSelectedForAction(new Set());
	}, [currentView, selectedMailbox]);

	// Derived State: Dynamic Mailboxes with Counts
	const mailboxesWithCounts = useMemo(
		() => getMailboxCounts(MOCK_MAILBOXES_STATIC, emails),
		[emails]
	);

	// Filtered Emails for List View
	const displayEmails = useMemo(
		() =>
			filterDisplayEmails(emails, {
				mailboxId: selectedMailbox,
				searchQuery,
				unreadOnly: isUnreadFilterActive,
			}),
		[emails, selectedMailbox, searchQuery, isUnreadFilterActive]
	);

	// Actions
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
			to: to,
			subject: subject,
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

		let updatedEmails;
		if (target.mailbox === 'trash') {
			updatedEmails = emails.filter(e => e.id !== id);
		} else {
			updatedEmails = emails.map(e => (e.id === id ? { ...e, mailbox: 'trash' } : e));
		}
		commitEmails(updatedEmails);

		if (currentView === 'detail') handleBack();
	};

	const handleArchiveEmail = (id: string) => {
		const updatedEmails = emails.map(e => (e.id === id ? { ...e, mailbox: 'archive' } : e));
		commitEmails(updatedEmails);
		if (currentView === 'detail') handleBack();
	};

	// Batch Actions
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

	if (!mounted) return null;

	const selectedEmail = emails.find(e => e.id === selectedEmailId);
	const selectedMailboxObj = mailboxesWithCounts.find(m => m.id === selectedMailbox);
	const mailboxTitle = selectedMailboxObj?.name || 'All Inboxes';

	return (
		<div
			className={`w-full h-full flex flex-col overflow-hidden font-sans ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save mailbox changes. Storage may be unavailable — changes will be lost on
					reload.
				</div>
			)}
			<div className="flex flex-1 overflow-hidden">
				{/* 1. Mailboxes Screen */}
				<div
					className={`
					flex flex-col
					w-full md:w-[300px] md:shrink-0 md:border-r ${darkMode ? 'md:border-white/10' : 'md:border-gray-200'}
					${currentView === 'mailboxes' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
				>
					{/* Mailboxes Navigation Bar */}
					<div
						className={`pt-10 px-4 pb-2 flex items-center justify-between shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}
					>
						<div className="w-12"></div>
						<div className="text-sm font-semibold tracking-tight opacity-0">Mailboxes</div>
						<button
							onClick={toggleEditMode}
							className="text-[#007aff] text-base font-normal active:opacity-50 transition-opacity"
						>
							{isEditing ? 'Done' : 'Edit'}
						</button>
					</div>

					{/* Mailboxes Large Title */}
					<div className={`px-4 pb-3 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
						<h1 className="text-3xl font-bold tracking-tight">Mailboxes</h1>
					</div>

					{/* Mailboxes Grouped Content */}
					<div className="flex-1 overflow-y-auto pb-4 space-y-4">
						{/* Smart Mailboxes Card */}
						<div
							className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'}`}
						>
							{mailboxesWithCounts
								.filter(m => m.type !== 'account')
								.map(mailbox => (
									<MailboxItem
										key={mailbox.id}
										item={mailbox}
										isActive={
											selectedMailbox === mailbox.id &&
											typeof window !== 'undefined' &&
											window.innerWidth >= 768
										}
										onClick={() => !isEditing && navigateToMailbox(mailbox.id)}
										darkMode={darkMode}
									/>
								))}
						</div>

						{/* Accounts Section */}
						{mailboxesWithCounts
							.filter(m => m.type === 'account')
							.map(account => (
								<div key={account.id} className="space-y-1.5">
									<div
										className="flex items-center justify-between px-6 cursor-pointer select-none"
										onClick={() => toggleAccount(account.id)}
									>
										<span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
											{account.name}
										</span>
										<i
											className={`fas fa-chevron-right text-[10px] text-gray-400 transition-transform duration-200 ${
												expandedAccounts.has(account.id) ? 'rotate-90' : ''
											}`}
										></i>
									</div>

									{expandedAccounts.has(account.id) && (
										<div
											className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'}`}
										>
											{ACCOUNT_FOLDERS.map(folder => (
												<MailboxItem
													key={`${account.id}-${folder.id}`}
													item={{
														...folder,
														count: emails.filter(e => e.mailbox === folder.id && !e.read).length,
													}}
													isActive={
														selectedMailbox === folder.id &&
														typeof window !== 'undefined' &&
														window.innerWidth >= 768
													}
													onClick={() => !isEditing && navigateToMailbox(folder.id)}
													darkMode={darkMode}
												/>
											))}
										</div>
									)}
								</div>
							))}
					</div>

					{/* Mailboxes Floating Liquid Glass Toolbar */}
					<div className="shrink-0 p-4 pb-8 flex items-center justify-center">
						<div
							className={`w-full max-w-[340px] px-5 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all ${
								darkMode
									? 'bg-[#1c1c1e]/80 border-white/15 text-white'
									: 'bg-white/80 border-black/5 text-black'
							}`}
						>
							<div className="w-8"></div>
							<div className="text-xs text-gray-400 font-medium">Updated Just Now</div>
							<button
								onClick={() => {
									triggerHaptic('light');
									setIsComposeOpen(true);
								}}
								className="text-[#007aff] text-base p-1 active:scale-95 transition-transform"
								aria-label="Compose Email"
							>
								<i className="far fa-edit"></i>
							</button>
						</div>
					</div>
				</div>

				{/* 2. Email List (Inbox) View */}
				<div
					className={`
					flex flex-col
					w-full md:w-[340px] md:shrink-0 md:border-r ${darkMode ? 'md:border-white/10 bg-black' : 'md:border-gray-200 bg-white'}
					${currentView === 'list' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
				>
					{/* List Navigation Bar */}
					<div
						className={`pt-10 px-4 pb-2 flex items-center justify-between shrink-0 ${darkMode ? 'bg-black' : 'bg-white'}`}
					>
						<button
							onClick={handleBack}
							className="flex items-center text-[#007aff] text-base font-normal md:hidden active:opacity-50 transition-opacity"
						>
							<i className="fas fa-chevron-left text-lg mr-1.5"></i>
							<span>Mailboxes</span>
						</button>
						<div className="hidden md:block w-8"></div>

						<button
							onClick={toggleEditMode}
							className="text-[#007aff] text-base font-normal active:opacity-50 transition-opacity"
						>
							{isEditing ? 'Done' : 'Edit'}
						</button>
					</div>

					{/* Large Title */}
					<div className={`px-4 pb-2 ${darkMode ? 'bg-black' : 'bg-white'}`}>
						<h1 className="text-3xl font-bold tracking-tight capitalize">{mailboxTitle}</h1>
					</div>

					{/* Search Bar */}
					<div className={`px-4 pb-3 ${darkMode ? 'bg-black' : 'bg-white'}`}>
						<div
							className={`flex items-center rounded-xl px-3 py-2 border ${
								darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-[#e3e3e8]/70 border-black/5'
							}`}
						>
							<i className="fas fa-search text-gray-400 mr-2 text-xs"></i>
							<input
								type="text"
								placeholder="Search"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
							/>
							{searchQuery && (
								<button onClick={() => setSearchQuery('')} className="text-gray-400 text-xs">
									<i className="fas fa-times-circle"></i>
								</button>
							)}
						</div>
					</div>

					{/* Email Item Rows */}
					<div className="flex-1 overflow-y-auto pb-4">
						{displayEmails.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
								<i className="fas fa-inbox text-4xl mb-2 opacity-40"></i>
								<p className="text-sm font-medium">
									{isUnreadFilterActive ? 'No Unread Mail' : 'No Mail'}
								</p>
							</div>
						) : (
							displayEmails.map(email => (
								<SwipeableEmailItem
									key={email.id}
									email={email}
									isSelected={selectedEmailId === email.id}
									isEditing={isEditing}
									isChecked={selectedForAction.has(email.id)}
									onClick={() => navigateToEmail(email.id)}
									onDelete={() => handleDeleteEmail(email.id)}
									onArchive={() => handleArchiveEmail(email.id)}
									darkMode={darkMode}
								/>
							))
						)}
					</div>

					{/* List Floating Liquid Glass Toolbar */}
					<div className="shrink-0 p-4 pb-8 flex items-center justify-center">
						<div
							className={`w-full max-w-[340px] px-5 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all ${
								darkMode
									? 'bg-[#1c1c1e]/80 border-white/15 text-white'
									: 'bg-white/80 border-black/5 text-black'
							}`}
						>
							{isEditing ? (
								<>
									<button
										onClick={handleBatchArchive}
										disabled={selectedForAction.size === 0}
										className={`text-sm font-medium ${selectedForAction.size > 0 ? 'text-[#007aff]' : 'text-gray-400'}`}
									>
										Archive
									</button>
									<div className="text-xs text-gray-400 font-medium">
										{selectedForAction.size > 0
											? `${selectedForAction.size} Selected`
											: 'Select Messages'}
									</div>
									<button
										onClick={handleBatchDelete}
										disabled={selectedForAction.size === 0}
										className={`text-sm font-medium ${selectedForAction.size > 0 ? 'text-[#ff3b30]' : 'text-gray-400'}`}
									>
										Delete
									</button>
								</>
							) : (
								<>
									<button
										onClick={() => {
											triggerHaptic('light');
											setIsUnreadFilterActive(!isUnreadFilterActive);
										}}
										className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 ${
											isUnreadFilterActive ? 'bg-[#007aff] text-white shadow-xs' : 'text-[#007aff]'
										}`}
										aria-label="Filter Unread"
									>
										<i className="fas fa-filter text-xs"></i>
									</button>

									<div className="text-xs text-gray-400 font-medium">
										{isUnreadFilterActive
											? 'Filtered by: Unread'
											: displayEmails.filter(e => !e.read).length > 0
												? `${displayEmails.filter(e => !e.read).length} Unread`
												: 'Updated Just Now'}
									</div>

									<button
										onClick={() => {
											triggerHaptic('light');
											setIsComposeOpen(true);
										}}
										className="text-[#007aff] text-base p-1 active:scale-95 transition-transform"
										aria-label="Compose Email"
									>
										<i className="far fa-edit"></i>
									</button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* 3. Email Detail Reading Pane */}
				<div
					className={`
					flex-col flex-1
					${currentView === 'detail' ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
				>
					{selectedEmail ? (
						<EmailDetail
							email={selectedEmail}
							mailboxName={mailboxTitle}
							onBack={handleBack}
							onReply={handleReply}
							onDelete={handleDeleteEmail}
							onArchive={handleArchiveEmail}
							darkMode={darkMode}
						/>
					) : (
						<div
							className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-black text-gray-500' : 'bg-white text-gray-400'}`}
						>
							<div className="text-center">
								<i className="fas fa-envelope-open text-5xl mb-3 opacity-30"></i>
								<p className="text-base font-medium">No Message Selected</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Compose Modal */}
			{isComposeOpen && (
				<ComposeModal
					darkMode={darkMode}
					onClose={() => setIsComposeOpen(false)}
					onSend={handleSendEmail}
				/>
			)}
		</div>
	);
}
