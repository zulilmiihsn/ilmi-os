'use client';

import type React from 'react';
import { ArrowUp, ChevronLeft, Phone } from 'lucide-react';
import { formatDayLabel, initials, type Conversation } from './conversations';

interface ChatViewProps {
	scrollRef: React.RefObject<HTMLDivElement>;
	mode: 'chat' | 'new';
	active: Conversation | null;
	draft: string;
	setDraft: (draft: string) => void;
	draftTo: string;
	setDraftTo: (to: string) => void;
	onBack: () => void;
	onSend: () => void;
	onCallContact: () => void;
}

export function ChatView({
	scrollRef,
	mode,
	active,
	draft,
	setDraft,
	draftTo,
	setDraftTo,
	onBack,
	onSend,
	onCallContact,
}: ChatViewProps) {
	return (
		<>
			{/* Chat header */}
			<div className="pt-10 px-2 pb-2 shrink-0 border-b border-black/5 dark:border-white/10">
				<div className="flex items-center justify-between">
					<button
						onClick={onBack}
						aria-label="Back to messages"
						className="relative p-2 active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
					>
						<ChevronLeft aria-hidden="true" size={22} className="text-ios-blue" />
					</button>
					{mode === 'chat' && active ? (
						<span className="flex items-center gap-2 min-w-0">
							<span
								aria-hidden="true"
								className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-white text-xs font-semibold flex items-center justify-center shrink-0"
							>
								{initials(active.name)}
							</span>
							<span className="text-base font-semibold truncate">{active.name}</span>
						</span>
					) : (
						<span className="text-base font-semibold">New Message</span>
					)}
					{mode === 'chat' && active ? (
						<button
							onClick={onCallContact}
							aria-label={`Call ${active.name}`}
							className="relative p-2 text-ios-blue active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
						>
							<Phone aria-hidden="true" size={20} />
						</button>
					) : (
						<span className="w-10" aria-hidden="true" />
					)}
				</div>
				{mode === 'new' && (
					<div className="flex items-center gap-2 px-2 pt-2">
						<span className="text-sm text-gray-400">To:</span>
						<input
							type="text"
							value={draftTo}
							onChange={e => setDraftTo(e.target.value)}
							placeholder="Name or number"
							aria-label="Recipient"
							autoFocus
							className="flex-1 bg-transparent border-none outline-none text-base placeholder-gray-400 min-w-0"
						/>
					</div>
				)}
			</div>

			{/* Thread */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
				{mode === 'chat' &&
					active &&
					(() => {
						let lastSide: boolean | null = null;
						let lastDay = '';
						return active.messages.map(m => {
							const day = formatDayLabel(m.sentAt);
							const showDay = day !== '' && day !== lastDay;
							if (day !== '') lastDay = day;
							const groupBreak = lastSide === null || lastSide !== m.fromMe;
							lastSide = m.fromMe;
							return (
								<div key={m.id}>
									{showDay && (
										<p className="text-center text-[11px] font-medium text-gray-400 my-3">{day}</p>
									)}
									<div
										className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'} ${groupBreak ? 'mt-3' : 'mt-1'}`}
									>
										<div
											className={`max-w-[70%] px-3.5 py-2 text-[17px] leading-[22px] whitespace-pre-wrap break-words ${
												m.fromMe
													? 'bg-ios-blue text-white rounded-[20px] rounded-br-md'
													: 'bg-[#e9e9eb] dark:bg-ios-dark-gray6 text-black dark:text-white rounded-[20px] rounded-bl-md'
											}`}
										>
											{m.text}
										</div>
									</div>
								</div>
							);
						});
					})()}
				{mode === 'new' && (
					<p className="text-center text-[11px] font-medium text-gray-400 my-3">
						Type a message below to start the conversation
					</p>
				)}
			</div>

			{/* Input bar */}
			<div className="shrink-0 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 flex items-end gap-2">
				<input
					type="text"
					value={draft}
					onChange={e => setDraft(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter') onSend();
					}}
					placeholder="iMessage"
					aria-label="Message text"
					className="flex-1 rounded-full border bg-transparent px-4 py-2.5 text-[17px] outline-none placeholder-gray-400 border-black/10 dark:border-white/20 min-w-0"
				/>
				<span className="w-9 h-9 shrink-0 flex items-center justify-center">
					{draft.trim() && (
						<button
							onClick={onSend}
							aria-label="Send message"
							className="w-9 h-9 rounded-full bg-ios-blue text-white flex items-center justify-center active:scale-95 transition-transform"
						>
							<ArrowUp aria-hidden="true" size={18} strokeWidth={2.5} />
						</button>
					)}
				</span>
			</div>
		</>
	);
}
