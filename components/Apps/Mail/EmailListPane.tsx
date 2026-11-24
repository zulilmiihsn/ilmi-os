'use client';

import {
	ChevronLeft,
	CircleX,
	Funnel,
	Inbox,
	Search,
	SquarePen,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';
import { Email, SwipeableEmailItem } from './index';

interface EmailListPaneProps {
	darkMode: boolean;
	isActiveView: boolean;
	animationClass: string;
	mailboxTitle: string;
	isEditing: boolean;
	searchQuery: string;
	displayEmails: Email[];
	selectedEmailId: string | null;
	selectedForAction: Set<string>;
	isUnreadFilterActive: boolean;
	onBack: () => void;
	onToggleEditMode: () => void;
	onSearchChange: (value: string) => void;
	onNavigateToEmail: (id: string) => void;
	onDeleteEmail: (id: string) => void;
	onArchiveEmail: (id: string) => void;
	onBatchArchive: () => void;
	onBatchDelete: () => void;
	onToggleUnreadFilter: () => void;
	onOpenCompose: () => void;
}

export default function EmailListPane({
	darkMode,
	isActiveView,
	animationClass,
	mailboxTitle,
	isEditing,
	searchQuery,
	displayEmails,
	selectedEmailId,
	selectedForAction,
	isUnreadFilterActive,
	onBack,
	onToggleEditMode,
	onSearchChange,
	onNavigateToEmail,
	onDeleteEmail,
	onArchiveEmail,
	onBatchArchive,
	onBatchDelete,
	onToggleUnreadFilter,
	onOpenCompose,
}: EmailListPaneProps) {
	return (
		<div
			className={`
					flex flex-col
					w-full md:w-[340px] md:shrink-0 md:border-r ${darkMode ? 'md:border-white/10 bg-black' : 'md:border-gray-200 bg-white'}
					${isActiveView ? `flex ${animationClass}` : 'hidden md:flex'}
				`}
		>
			{/* List Navigation Bar */}
			<div
				className={`pt-10 px-4 pb-2 flex items-center justify-between shrink-0 ${darkMode ? 'bg-black' : 'bg-white'}`}
			>
				<button
					onClick={onBack}
					className="relative flex items-center text-ios-blue text-base font-normal md:hidden active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={18} className="mr-1.5" />
					<span>Mailboxes</span>
				</button>
				<div className="hidden md:block w-8"></div>

				<button
					onClick={onToggleEditMode}
					className="relative text-ios-blue text-base font-normal active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					{isEditing ? 'Done' : 'Edit'}
				</button>
			</div>

			{/* Large Title */}
			<div className={`px-4 pb-2 ${darkMode ? 'bg-black' : 'bg-white'}`}>
				<h1 className="text-ios-large-title capitalize">{mailboxTitle}</h1>
			</div>

			{/* Search Bar */}
			<div className={`px-4 pb-3 ${darkMode ? 'bg-black' : 'bg-white'}`}>
				<div
					className={`flex items-center rounded-xl px-3 py-2 border ${
						darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-[#e3e3e8]/70 border-black/5'
					}`}
				>
					<Search aria-hidden="true" size={12} className="text-gray-400 mr-2" />
					<input
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
					/>
					{searchQuery && (
						<button onClick={() => onSearchChange('')} aria-label="Clear search" className="text-gray-400 text-xs">
							<CircleX aria-hidden="true" size={12} />
						</button>
					)}
				</div>
			</div>

			{/* Email Item Rows */}
			<div className="flex-1 overflow-y-auto pb-4">
				{displayEmails.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
						<Inbox aria-hidden="true" size={36} className="mb-2 opacity-40" />
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
							onClick={() => onNavigateToEmail(email.id)}
							onDelete={() => onDeleteEmail(email.id)}
							onArchive={() => onArchiveEmail(email.id)}
							darkMode={darkMode}
						/>
					))
				)}
			</div>

			{/* List Floating Liquid Glass Toolbar */}
			<div className="shrink-0 p-4 pb-[max(env(safe-area-inset-bottom),2rem)] flex items-center justify-center">
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
								onClick={onBatchArchive}
								disabled={selectedForAction.size === 0}
								className={`text-sm font-medium ${selectedForAction.size > 0 ? 'text-ios-blue' : 'text-gray-400'}`}
							>
								Archive
							</button>
							<div className="text-xs text-gray-400 font-medium">
								{selectedForAction.size > 0
									? `${selectedForAction.size} Selected`
									: 'Select Messages'}
							</div>
							<button
								onClick={onBatchDelete}
								disabled={selectedForAction.size === 0}
								className={`text-sm font-medium ${selectedForAction.size > 0 ? 'text-ios-red' : 'text-gray-400'}`}
							>
								Delete
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => {
									triggerHaptic('light');
									onToggleUnreadFilter();
								}}
								className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 after:absolute after:-inset-2 after:content-[''] ${
									isUnreadFilterActive ? 'bg-ios-blue text-white shadow-xs' : 'text-ios-blue'
								}`}
								aria-label="Filter Unread"
							>
								<Funnel aria-hidden="true" size={12} />
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
									onOpenCompose();
								}}
								className="relative text-ios-blue active:scale-95 transition-transform after:absolute after:-inset-2.5 after:content-['']"
								aria-label="Compose Email"
							>
								<SquarePen aria-hidden="true" size={24} />
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
