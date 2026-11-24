'use client';

import { displayHost, type HistoryEntry } from './browsing';

interface SafariStartPageProps {
	favorites: string[];
	history: HistoryEntry[];
	darkMode: boolean;
	onNavigate: (url: string) => void;
	onClearHistory: () => void;
}

export function SafariStartPage({
	favorites,
	history,
	darkMode,
	onNavigate,
	onClearHistory,
}: SafariStartPageProps) {
	return (
		<div className="absolute inset-0 overflow-y-auto px-5 pt-10 pb-4">
			<h1 className="text-ios-large-title mb-4">Start Page</h1>
			<h2 className="text-sm font-semibold mb-2">Favorites</h2>
			<div className="grid grid-cols-4 gap-4 mb-6">
				{favorites.map(f => (
					<button
						key={f}
						onClick={() => onNavigate(f)}
						aria-label={`Open ${displayHost(f)}`}
						className="flex flex-col items-center gap-1.5 active:opacity-60 transition-opacity"
					>
						<span
							aria-hidden="true"
							className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/10 text-ios-blue text-xl font-semibold flex items-center justify-center"
						>
							{displayHost(f).charAt(0).toUpperCase()}
						</span>
						<span className="text-[11px] truncate w-full text-center">{displayHost(f)}</span>
					</button>
				))}
			</div>
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-sm font-semibold">History</h2>
				{history.length > 0 && (
					<button
						onClick={onClearHistory}
						aria-label="Clear history"
						className="text-xs text-ios-blue active:opacity-50 transition-opacity"
					>
						Clear
					</button>
				)}
			</div>
			{history.length === 0 ? (
				<p className="text-sm text-gray-400">Pages you visit will appear here.</p>
			) : (
				<div
					className={`rounded-xl overflow-hidden border ${
						darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-[#f2f2f7] border-black/5'
					}`}
				>
					{history.slice(0, 10).map((h, i, arr) => (
						<button
							key={`${h.url}-${h.at}`}
							onClick={() => onNavigate(h.url)}
							aria-label={`Revisit ${displayHost(h.url)}`}
							className={`w-full text-left px-4 py-2.5 active:bg-black/5 dark:active:bg-white/10 transition-colors ${
								i < arr.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
							}`}
						>
							<span className="block text-sm font-normal truncate">{displayHost(h.url)}</span>
							<span className="block text-xs text-gray-400 truncate">{h.url}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
