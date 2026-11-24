'use client';

import type React from 'react';
import { ChevronRight, Search, SquarePen, X } from 'lucide-react';
import { formatMessageTime, initials, lastMessage, type Conversation } from './conversations';

interface ConversationListViewProps {
	scrollRef: React.RefObject<HTMLDivElement>;
	visible: Conversation[];
	query: string;
	setQuery: (query: string) => void;
	onOpenConvo: (id: string) => void;
	onNewMessage: () => void;
}

export function ConversationListView({
	scrollRef,
	visible,
	query,
	setQuery,
	onOpenConvo,
	onNewMessage,
}: ConversationListViewProps) {
	return (
		<>
			<div className="pt-10 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Messages</h1>
			</div>
			<div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
				{visible.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
						<p className="text-lg font-semibold mb-1">{query ? 'No Results' : 'No Messages'}</p>
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
										onClick={() => onOpenConvo(c.id)}
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
										<ChevronRight
											aria-hidden="true"
											size={12}
											className="text-gray-300 dark:text-gray-600 shrink-0"
										/>
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
					onClick={onNewMessage}
					aria-label="New message"
					className="w-12 h-12 rounded-full bg-white/80 dark:bg-[#1c1c1e]/80 border border-black/5 dark:border-white/15 shadow-lg backdrop-blur-2xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
				>
					<SquarePen aria-hidden="true" size={22} className="text-ios-blue" />
				</button>
			</div>
		</>
	);
}
