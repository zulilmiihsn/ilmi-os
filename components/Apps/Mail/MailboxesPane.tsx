'use client';

import { ChevronRight, SquarePen } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';
import { Email, Mailbox, ACCOUNT_FOLDERS, MailboxItem } from './index';

interface MailboxesPaneProps {
	darkMode: boolean;
	isActiveView: boolean;
	animationClass: string;
	isEditing: boolean;
	onToggleEditMode: () => void;
	mailboxesWithCounts: Mailbox[];
	hiddenMailboxes: string[];
	selectedMailbox: string;
	expandedAccounts: Set<string>;
	emails: Email[];
	onToggleHiddenMailbox: (key: string) => void;
	onNavigateToMailbox: (mailboxId: string) => void;
	onToggleAccount: (id: string) => void;
	onOpenCompose: () => void;
}

export default function MailboxesPane({
	darkMode,
	isActiveView,
	animationClass,
	isEditing,
	onToggleEditMode,
	mailboxesWithCounts,
	hiddenMailboxes,
	selectedMailbox,
	expandedAccounts,
	emails,
	onToggleHiddenMailbox,
	onNavigateToMailbox,
	onToggleAccount,
	onOpenCompose,
}: MailboxesPaneProps) {
	return (
		<div
			className={`
					flex flex-col
					w-full @2xl:w-[260px] @2xl:shrink-0 @2xl:border-r ${darkMode ? '@2xl:border-white/10' : '@2xl:border-gray-200'}
					${isActiveView ? `flex ${animationClass}` : 'hidden @2xl:flex'}
				`}
		>
			{/* Mailboxes Navigation Bar */}
			<div
				className={`pt-3 px-4 pb-2 flex items-center justify-end shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}
			>
				<button
					onClick={onToggleEditMode}
					className="relative text-ios-blue text-base font-normal active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					{isEditing ? 'Done' : 'Edit'}
				</button>
			</div>

			{/* Mailboxes Large Title */}
			<div className={`px-4 pb-3 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
				<h1 className="text-ios-large-title">Mailboxes</h1>
			</div>

			{/* Mailboxes Grouped Content */}
			<div className="flex-1 overflow-y-auto pb-4 space-y-4">
				{/* Smart Mailboxes Card */}
				<div
					className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'}`}
				>
					{mailboxesWithCounts
						.filter(m => m.type !== 'account')
						.filter(m => isEditing || !hiddenMailboxes.includes(m.id))
						.map(mailbox => (
							<MailboxItem
								key={mailbox.id}
								item={mailbox}
								isActive={selectedMailbox === mailbox.id}
								dimmed={hiddenMailboxes.includes(mailbox.id)}
								onClick={() =>
									isEditing ? onToggleHiddenMailbox(mailbox.id) : onNavigateToMailbox(mailbox.id)
								}
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
								onClick={() => onToggleAccount(account.id)}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onToggleAccount(account.id);
									}
								}}
								role="button"
								tabIndex={0}
								aria-expanded={expandedAccounts.has(account.id)}
								aria-label={`${account.name} folders`}
							>
								<span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
									{account.name}
								</span>
								<ChevronRight
									aria-hidden="true"
									size={10}
									className={`text-gray-400 transition-transform duration-200 ${
										expandedAccounts.has(account.id) ? 'rotate-90' : ''
									}`}
								/>
							</div>

							{expandedAccounts.has(account.id) && (
								<div
									className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'}`}
								>
									{ACCOUNT_FOLDERS.filter(folder =>
										isEditing ? true : !hiddenMailboxes.includes(`${account.id}-${folder.id}`)
									).map(folder => (
										<MailboxItem
											key={`${account.id}-${folder.id}`}
											item={{
												...folder,
												count:
													folder.id === 'inbox'
														? emails.filter(e => e.mailbox === 'inbox' && !e.read).length
														: emails.filter(e => e.mailbox === folder.id).length,
											}}
											isActive={selectedMailbox === folder.id}
											dimmed={hiddenMailboxes.includes(`${account.id}-${folder.id}`)}
											onClick={() =>
												isEditing
													? onToggleHiddenMailbox(`${account.id}-${folder.id}`)
													: onNavigateToMailbox(folder.id)
											}
											darkMode={darkMode}
										/>
									))}
								</div>
							)}
						</div>
					))}
			</div>

			{/* Mailboxes Floating Liquid Glass Toolbar */}
			<div className="shrink-0 p-4 pb-[max(env(safe-area-inset-bottom),2rem)] flex items-center justify-center">
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
							onOpenCompose();
						}}
						className="relative text-ios-blue active:scale-95 transition-transform after:absolute after:-inset-2.5 after:content-['']"
						aria-label="Compose Email"
					>
						<SquarePen aria-hidden="true" size={24} />
					</button>
				</div>
			</div>
		</div>
	);
}
