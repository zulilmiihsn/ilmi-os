'use client';

import { Plus } from 'lucide-react';
import { currentUrl, displayHost, type BrowserTab } from './browsing';

interface SafariTabOverviewProps {
	tabs: BrowserTab[];
	active: BrowserTab | null;
	onDone: () => void;
	onOpenTab: (id: string) => void;
	onCloseTab: (id: string) => void;
	onAddTab: () => void;
}

export function SafariTabOverview({
	tabs,
	active,
	onDone,
	onOpenTab,
	onCloseTab,
	onAddTab,
}: SafariTabOverviewProps) {
	return (
		<div className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1.75rem)]">
			<div className="max-w-3xl mx-auto">
				<div className="flex items-center justify-between mb-4 px-1">
					<h1 className="text-ios-large-title">{tabs.length} Tabs</h1>
					<button
						onClick={onDone}
						aria-label="Done viewing tabs"
						className="text-ios-blue text-base font-normal active:opacity-50 transition-opacity"
					>
						Done
					</button>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{tabs.map(t => {
						const u = currentUrl(t);
						const isActive = active !== null && t.id === active.id;
						return (
							<div
								key={t.id}
								className={`rounded-2xl border overflow-hidden ${
									isActive ? 'border-ios-blue' : 'border-black/5 dark:border-white/10'
								} bg-[#f2f2f7] dark:bg-[#1c1c1e]`}
							>
								<button
									onClick={() => onOpenTab(t.id)}
									aria-label={u ? `Open ${displayHost(u)}` : 'Open empty tab'}
									className="w-full p-3 text-left active:opacity-60 transition-opacity"
								>
									<span
										aria-hidden="true"
										className="w-10 h-10 rounded-xl bg-ios-blue/15 text-ios-blue text-lg font-semibold flex items-center justify-center mb-2"
									>
										{u ? displayHost(u).charAt(0).toUpperCase() : '+'}
									</span>
									<span className="block text-sm font-medium truncate">
										{u ? displayHost(u) : 'Start Page'}
									</span>
									<span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
										{u ?? 'No page open'}
									</span>
								</button>
								<button
									onClick={() => onCloseTab(t.id)}
									aria-label={u ? `Close ${displayHost(u)}` : 'Close tab'}
									className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 active:opacity-50 transition-opacity border-t border-black/5 dark:border-white/10"
								>
									Close
								</button>
							</div>
						);
					})}
				</div>
				<button
					onClick={onAddTab}
					aria-label="New tab"
					className="mt-4 w-full py-3 rounded-2xl border border-dashed border-black/10 dark:border-white/20 text-ios-blue text-base font-medium active:opacity-60 transition-opacity flex items-center justify-center gap-2"
				>
					<Plus aria-hidden="true" size={18} /> New Tab
				</button>
			</div>
		</div>
	);
}
