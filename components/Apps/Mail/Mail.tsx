'use client';

import { MailOpen } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { ComposeModal, EmailDetail } from './index';
import MailboxesPane from './MailboxesPane';
import EmailListPane from './EmailListPane';
import { useMailState } from './useMailState';

export default function Mail() {
	const { darkMode } = useSettingsStore();
	const state = useMailState();

	if (!state.mounted) return null;

	const selectedEmail = state.emails.find(e => e.id === state.selectedEmailId);
	const selectedMailboxObj = state.mailboxesWithCounts.find(m => m.id === state.selectedMailbox);
	const mailboxTitle = selectedMailboxObj?.name || 'All Inboxes';

	return (
		<div
			className={`@container w-full h-full flex flex-col overflow-hidden font-sans ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}
		>
			{state.persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save mailbox changes. Storage may be unavailable — changes will be lost on
					reload.
				</div>
			)}
			<div className="flex flex-1 overflow-hidden">
				<MailboxesPane
					darkMode={darkMode}
					isActiveView={state.currentView === 'mailboxes'}
					animationClass={state.animationClass}
					isEditing={state.isEditing}
					onToggleEditMode={state.toggleEditMode}
					mailboxesWithCounts={state.mailboxesWithCounts}
					hiddenMailboxes={state.hiddenMailboxes}
					selectedMailbox={state.selectedMailbox}
					expandedAccounts={state.expandedAccounts}
					emails={state.emails}
					onToggleHiddenMailbox={state.toggleHiddenMailbox}
					onNavigateToMailbox={state.navigateToMailbox}
					onToggleAccount={state.toggleAccount}
					onOpenCompose={() => state.setIsComposeOpen(true)}
				/>

				<EmailListPane
					darkMode={darkMode}
					isActiveView={state.currentView === 'list'}
					animationClass={state.animationClass}
					mailboxTitle={mailboxTitle}
					isEditing={state.isEditing}
					searchQuery={state.searchQuery}
					displayEmails={state.displayEmails}
					selectedEmailId={state.selectedEmailId}
					selectedForAction={state.selectedForAction}
					isUnreadFilterActive={state.isUnreadFilterActive}
					onBack={state.handleBack}
					onToggleEditMode={state.toggleEditMode}
					onSearchChange={state.setSearchQuery}
					onNavigateToEmail={state.navigateToEmail}
					onDeleteEmail={state.handleDeleteEmail}
					onArchiveEmail={state.handleArchiveEmail}
					onBatchArchive={state.handleBatchArchive}
					onBatchDelete={state.handleBatchDelete}
					onToggleUnreadFilter={() => state.setIsUnreadFilterActive(!state.isUnreadFilterActive)}
					onOpenCompose={() => state.setIsComposeOpen(true)}
				/>

				{/* 3. Email Detail Reading Pane */}
				<div
					className={`
					flex-col flex-1 min-w-0
					${state.currentView === 'detail' ? `flex ${state.animationClass}` : 'hidden @2xl:flex'}
				`}
				>
					{selectedEmail ? (
						<EmailDetail
							email={selectedEmail}
							mailboxName={mailboxTitle}
							onBack={state.handleBack}
							onReply={state.handleReply}
							onDelete={state.handleDeleteEmail}
							onArchive={state.handleArchiveEmail}
							darkMode={darkMode}
						/>
					) : (
						<div
							className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-black text-gray-500' : 'bg-white text-gray-400'}`}
						>
							<div className="text-center">
								<MailOpen aria-hidden="true" size={48} className="mb-3 opacity-30" />
								<p className="text-base font-medium">No Message Selected</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Compose Modal */}
			{state.isComposeOpen && (
				<ComposeModal
					darkMode={darkMode}
					onClose={() => state.setIsComposeOpen(false)}
					onSend={state.handleSendEmail}
				/>
			)}
		</div>
	);
}
