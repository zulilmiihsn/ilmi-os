'use client';

import { useState, type RefObject } from 'react';
import { ArrowUp, ChevronLeft, Mic, Phone, Plus } from 'lucide-react';
import { avatarGradient, formatDayLabel, initials, type Conversation } from './conversations';

interface ChatViewProps {
	scrollRef: RefObject<HTMLDivElement>;
	mode: 'chat' | 'new';
	active: Conversation | null;
	draft: string;
	setDraft: (draft: string) => void;
	draftTo: string;
	setDraftTo: (to: string) => void;
	recipientError: string | null;
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
	recipientError,
	onBack,
	onSend,
	onCallContact,
}: ChatViewProps) {
	const [inputHint, setInputHint] = useState<string | null>(null);

	return (
		<>
			{/* Chat header */}
			<div className="pt-3 px-2 pb-2 shrink-0 border-b border-black/5 dark:border-white/10">
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
								className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(active.name)} text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-xs`}
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
					<div className="px-2 pt-2">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500 dark:text-gray-400">To:</span>
							<input
								type="text"
								value={draftTo}
								onChange={e => setDraftTo(e.target.value)}
								placeholder="Name or number"
								aria-label="Recipient"
								autoFocus
								className="flex-1 bg-transparent border-none outline-none text-base placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
							/>
						</div>
						{recipientError && (
							<p role="alert" className="text-xs text-ios-red mt-1">
								{recipientError}
							</p>
						)}
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
						const total = active.messages.length;
						return active.messages.map((m, idx) => {
							const day = formatDayLabel(m.sentAt);
							const showDay = day !== '' && day !== lastDay;
							if (day !== '') lastDay = day;
							const groupBreak = lastSide === null || lastSide !== m.fromMe;
							lastSide = m.fromMe;

							const nextMsg = active.messages[idx + 1];
							const nextDay = nextMsg ? formatDayLabel(nextMsg.sentAt) : '';
							const isLastInGroup =
								!nextMsg || nextMsg.fromMe !== m.fromMe || (nextDay !== '' && nextDay !== day);
							const isLastMessage = idx === total - 1;

							const bubbleCorners = m.fromMe
								? isLastInGroup
									? 'rounded-[20px] rounded-br-md'
									: 'rounded-[20px]'
								: isLastInGroup
									? 'rounded-[20px] rounded-bl-md'
									: 'rounded-[20px]';

							return (
								<div key={m.id}>
									{showDay && (
										<p className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 my-3">
											{day}
										</p>
									)}
									<div
										className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'} ${groupBreak ? 'mt-3' : 'mt-1'}`}
									>
										<div
											className={`max-w-[72%] px-3.5 py-2 text-[17px] leading-[22px] whitespace-pre-wrap break-words ${bubbleCorners} ${
												m.fromMe
													? 'bg-ios-blue text-white'
													: 'bg-[#e9e9eb] dark:bg-[#2c2c2e] text-black dark:text-white'
											}`}
										>
											{m.text}
										</div>
									</div>
									{isLastMessage && m.fromMe && (
										<p className="text-right text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 pr-1">
											Delivered
										</p>
									)}
								</div>
							);
						});
					})()}
				{mode === 'new' && (
					<p className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 my-3">
						Type a message below to start the conversation
					</p>
				)}
			</div>

			{/* Subtle hint for non-sending controls */}
			{inputHint && (
				<div className="shrink-0 px-4 pb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
					<span>{inputHint}</span>
					<button
						type="button"
						onClick={() => setInputHint(null)}
						className="text-ios-blue ml-2 font-medium"
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Input bar */}
			<div className="shrink-0 px-3 pb-[max(env(safe-area-inset-bottom),1.75rem)] pt-2 flex items-center gap-2">
				<button
					type="button"
					onClick={() =>
						setInputHint(prev =>
							prev === 'Attachments are not available in offline preview.'
								? null
								: 'Attachments are not available in offline preview.'
						)
					}
					aria-label="Add attachment"
					className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
				>
					<Plus aria-hidden="true" size={18} />
				</button>
				<div className="flex-1 flex items-center rounded-full border bg-transparent pl-4 pr-1.5 py-1 border-black/15 dark:border-white/20 min-w-0">
					<input
						type="text"
						value={draft}
						onChange={e => setDraft(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') onSend();
						}}
						placeholder="iMessage"
						aria-label="Message text"
						className="flex-1 bg-transparent py-1.5 text-[17px] outline-none placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
					/>
					<span className="w-8 h-8 shrink-0 flex items-center justify-center ml-1">
						{draft.trim() ? (
							<button
								onClick={onSend}
								aria-label="Send message"
								className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center active:scale-95 transition-transform"
							>
								<ArrowUp aria-hidden="true" size={18} strokeWidth={2.5} />
							</button>
						) : (
							<button
								type="button"
								onClick={() =>
									setInputHint(prev =>
										prev === 'Voice messages are not available in offline preview.'
											? null
											: 'Voice messages are not available in offline preview.'
									)
								}
								aria-label="Voice message"
								className="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
							>
								<Mic aria-hidden="true" size={18} />
							</button>
						)}
					</span>
				</div>
			</div>
		</>
	);
}
