'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, Phone, Search, SquarePen, X } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	addMessage,
	createConversation,
	filterConversations,
	formatDayLabel,
	formatMessageTime,
	initials,
	lastMessage,
	loadConversations,
	markRead,
	saveConversations,
	type Conversation,
} from './conversations';

type View = { name: 'list' } | { name: 'chat'; id: string } | { name: 'new' };

export default function Messages() {
	const { darkMode } = useSettingsStore();
	const [convos, setConvos] = useState<Conversation[]>([]);
	const [view, setView] = useState<View>({ name: 'list' });
	const [query, setQuery] = useState('');
	const [draft, setDraft] = useState('');
	const [draftTo, setDraftTo] = useState('');
	const [persistError, setPersistError] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setConvos(loadConversations());
	}, []);

	const persist = (next: Conversation[]) => {
		setConvos(next);
		if (!saveConversations(next)) setPersistError(true);
	};

	const openConvo = (id: string) => {
		triggerHaptic('light');
		persist(markRead(convos, id));
		setDraft('');
		setView({ name: 'chat', id });
	};

	const goBack = () => {
		triggerHaptic('light');
		setDraft('');
		setDraftTo('');
		setView({ name: 'list' });
	};

	const send = () => {
		const body = draft.trim();
		if (!body) return;
		triggerHaptic('medium');
		if (view.name === 'new') {
			const next = createConversation(convos, draftTo, body);
			if (next.length === convos.length) return;
			persist(next);
			const created = next[0];
			if (created) setView({ name: 'chat', id: created.id });
		} else if (view.name === 'chat') {
			persist(addMessage(convos, view.id, body));
		}
		setDraft('');
		setDraftTo('');
	};

	const callContact = () => {
		triggerHaptic('medium');
		window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'phone' }));
	};

	const active = view.name === 'chat' ? (convos.find(c => c.id === view.id) ?? null) : null;
	const visible = useMemo(() => filterConversations(convos, query), [convos, query]);

	useEffect(() => {
		const el = scrollRef.current;
		if (el && view.name !== 'list') el.scrollTop = el.scrollHeight;
	}, [view, convos]);

	return (
		<div
			className={`messages-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-white text-black'
			}`}
			onKeyDown={e => {
				if (e.key === 'Escape' && view.name !== 'list') goBack();
			}}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save messages. Storage may be unavailable — changes will be lost on
					reload.
				</div>
			)}

			{view.name === 'list' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Messages</h1>
					</div>
					<div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
						{visible.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
								<p className="text-lg font-semibold mb-1">
									{query ? 'No Results' : 'No Messages'}
								</p>
								<p className="text-sm">
									{query ? `Nothing matches “${query.trim()}”.` : 'Start one with the compose button.'}
								</p>
							</div>
						) : (
							<ul className="m-0 list-none p-0">
								{visible.map((c, i) => {
									const last = lastMessage(c);
									return (
										<li key={c.id}>
											<button
												onClick={() => openConvo(c.id)}
												aria-label={`${c.name}${c.read ? '' : ', unread'}`}
												className="w-full flex items-center gap-3 pl-4 pr-3 min-h-[86px] py-3 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors"
											>
												<span
													aria-hidden="true"
													className="w-[45px] h-[45px] rounded-full bg-gray-300 dark:bg-gray-600 text-white text-[21px] font-semibold flex items-center justify-center shrink-0"
												>
													{initials(c.name)}
												</span>
												<span className="flex-1 min-w-0">
													<span className="flex items-baseline justify-between gap-2">
														<span
															className={`text-[17px] truncate ${
																c.read ? 'font-semibold' : 'font-bold'
															}`}
														>
															{c.name}
														</span>
														<span className="flex items-center gap-1.5 shrink-0">
															{!c.read && <span className="w-2.5 h-2.5 rounded-full bg-ios-blue" />}
															<span className="text-[15px] text-gray-400">
																{last ? formatMessageTime(last.sentAt) : ''}
															</span>
														</span>
													</span>
													<span className="block text-[15px] leading-5 text-gray-400 line-clamp-2">
														{last?.text ?? ''}
													</span>
												</span>
												<ChevronRight aria-hidden="true" size={12} className="text-gray-300 dark:text-gray-600 shrink-0" />
											</button>
											{i < visible.length - 1 && (
												<span
													aria-hidden="true"
													className="block h-px ml-[73px] bg-black/5 dark:bg-white/10"
												/>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{/* Bottom bar: search pill + separate compose button (iOS 26) */}
					<div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),1.75rem)] flex items-end gap-3">
						<div className="flex-1 flex items-center rounded-full px-4 h-12 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
							<Search aria-hidden="true" size={16} className="text-gray-400 mr-2 shrink-0" />
							<input
								type="text"
								value={query}
								onChange={e => setQuery(e.target.value)}
								placeholder="Search"
								aria-label="Search conversations"
								className="flex-1 bg-transparent border-none outline-none text-[17px] placeholder-gray-400 min-w-0"
							/>
							{query && (
								<button
									onClick={() => setQuery('')}
									aria-label="Clear search"
									className="text-gray-400 ml-2"
								>
									<X aria-hidden="true" size={14} />
								</button>
							)}
						</div>
						<button
							onClick={() => {
								triggerHaptic('light');
								setDraft('');
								setDraftTo('');
								setView({ name: 'new' });
							}}
							aria-label="New message"
							className="w-12 h-12 rounded-full bg-white/80 dark:bg-[#1c1c1e]/80 border border-black/5 dark:border-white/15 shadow-lg backdrop-blur-2xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
						>
							<SquarePen aria-hidden="true" size={22} className="text-ios-blue" />
						</button>
					</div>
				</>
			)}

			{(view.name === 'chat' || view.name === 'new') && (
				<>
					{/* Chat header */}
					<div className="pt-10 px-2 pb-2 shrink-0 border-b border-black/5 dark:border-white/10">
						<div className="flex items-center justify-between">
							<button
								onClick={goBack}
								aria-label="Back to messages"
								className="relative p-2 active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
							>
								<ChevronLeft aria-hidden="true" size={22} className="text-ios-blue" />
							</button>
							{view.name === 'chat' && active ? (
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
							{view.name === 'chat' && active ? (
								<button
									onClick={callContact}
									aria-label={`Call ${active.name}`}
									className="relative p-2 text-ios-blue active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
								>
									<Phone aria-hidden="true" size={20} />
								</button>
							) : (
								<span className="w-10" aria-hidden="true" />
							)}
						</div>
						{view.name === 'new' && (
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
						{view.name === 'chat' &&
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
												<p className="text-center text-[11px] font-medium text-gray-400 my-3">
													{day}
												</p>
											)}
											<div className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'} ${groupBreak ? 'mt-3' : 'mt-1'}`}>
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
						{view.name === 'new' && (
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
								if (e.key === 'Enter') send();
							}}
							placeholder="iMessage"
							aria-label="Message text"
							className="flex-1 rounded-full border bg-transparent px-4 py-2.5 text-[17px] outline-none placeholder-gray-400 border-black/10 dark:border-white/20 min-w-0"
						/>
						<span className="w-9 h-9 shrink-0 flex items-center justify-center">
							{draft.trim() && (
								<button
									onClick={send}
									aria-label="Send message"
									className="w-9 h-9 rounded-full bg-ios-blue text-white flex items-center justify-center active:scale-95 transition-transform"
								>
									<ArrowUp aria-hidden="true" size={18} strokeWidth={2.5} />
								</button>
							)}
						</span>
					</div>
				</>
			)}
		</div>
	);
}
