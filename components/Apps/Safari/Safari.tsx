'use client';

import { useState, useEffect } from 'react';
import {
	Bookmark,
	ChevronLeft,
	ChevronRight,
	Copy,
	LoaderCircle,
	Plus,
	RotateCw,
	Share,
} from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	DEFAULT_FAVORITES,
	currentUrl,
	displayHost,
	loadBookmarks,
	loadHistory,
	navigateTab,
	newTab,
	normalizeUrl,
	recordVisit,
	saveBookmarks,
	saveHistory,
	toggleBookmark,
	type BrowserTab,
	type HistoryEntry,
} from './browsing';

export default function Safari() {
	const { darkMode } = useSettingsStore();
	const [tabs, setTabs] = useState<BrowserTab[]>(() => [newTab()]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overview, setOverview] = useState(false);
	const [editing, setEditing] = useState(false);
	const [addressText, setAddressText] = useState('');
	const [loading, setLoading] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [bookmarks, setBookmarks] = useState<string[]>([]);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [persistError, setPersistError] = useState(false);

	useEffect(() => {
		setBookmarks(loadBookmarks());
		setHistory(loadHistory());
	}, []);

	useEffect(() => {
		setBookmarks(loadBookmarks());
		setHistory(loadHistory());
	}, []);

	const active = tabs.find(t => t.id === (activeId ?? tabs[0]?.id)) ?? tabs[0] ?? null;
	const url = active ? currentUrl(active) : null;

	const updateTab = (id: string, next: BrowserTab) => {
		setTabs(prev => prev.map(t => (t.id === id ? next : t)));
	};

	const navigate = (raw: string) => {
		const target = normalizeUrl(raw);
		if (!target || !active) return;
		triggerHaptic('medium');
		updateTab(active.id, navigateTab(active, target));
		const nextHistory = recordVisit(history, target);
		setHistory(nextHistory);
		if (!saveHistory(nextHistory)) setPersistError(true);
		setLoading(true);
		setEditing(false);
	};

	const goBack = () => {
		if (!active || active.hi <= 0) return;
		triggerHaptic('light');
		updateTab(active.id, { ...active, hi: active.hi - 1 });
		setLoading(true);
	};

	const goForward = () => {
		if (!active || active.hi >= active.history.length - 1) return;
		triggerHaptic('light');
		updateTab(active.id, { ...active, hi: active.hi + 1 });
		setLoading(true);
	};

	const reload = () => {
		if (!url) return;
		triggerHaptic('light');
		setLoading(true);
		setReloadKey(k => k + 1);
	};

	const openExternal = () => {
		if (!url) return;
		triggerHaptic('light');
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const toggleCurrentBookmark = () => {
		if (!url) return;
		triggerHaptic('light');
		const next = toggleBookmark(bookmarks, url);
		setBookmarks(next);
		if (!saveBookmarks(next)) setPersistError(true);
	};

	const openTab = (id: string) => {
		triggerHaptic('light');
		setActiveId(id);
		setOverview(false);
		setEditing(false);
	};

	const closeTab = (id: string) => {
		triggerHaptic('medium');
		setTabs(prev => {
			const rest = prev.filter(t => t.id !== id);
			const kept = rest.length > 0 ? rest : [newTab()];
			if (activeId === id || !rest.some(t => t.id === activeId)) {
				setActiveId(kept[0]?.id ?? null);
			}
			return kept;
		});
	};

	const addTab = () => {
		triggerHaptic('light');
		const tab = newTab();
		setTabs(prev => [...prev, tab]);
		setActiveId(tab.id);
		setOverview(false);
		setEditing(false);
	};

	const clearHistory = () => {
		triggerHaptic('medium');
		setHistory([]);
		if (!saveHistory([])) setPersistError(true);
	};

	const favorites = [...DEFAULT_FAVORITES, ...bookmarks.filter(b => !DEFAULT_FAVORITES.includes(b))];
	const saved = url !== null && bookmarks.includes(url);

	return (
		<div
			className={`safari-app w-full h-full flex flex-col overflow-hidden font-sans select-none ${
				darkMode ? 'bg-black text-white' : 'bg-white text-black'
			}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save browsing data. Storage may be unavailable — changes will be lost on
					reload.
				</div>
			)}

			{/* Web area / start page / overview */}
			<div className="flex-1 relative overflow-hidden">
				{overview ? (
					<div className="absolute inset-0 overflow-y-auto px-4 pt-10 pb-4">
						<div className="flex items-center justify-between mb-4 px-1">
							<h1 className="text-ios-large-title">{tabs.length} Tabs</h1>
							<button
								onClick={() => setOverview(false)}
								aria-label="Done viewing tabs"
								className="text-ios-blue text-base font-normal active:opacity-50 transition-opacity"
							>
								Done
							</button>
						</div>
						<div className="grid grid-cols-2 gap-3">
							{tabs.map(t => {
								const u = currentUrl(t);
								const isActive = active !== null && t.id === active.id;
								return (
									<div
										key={t.id}
										className={`rounded-2xl border overflow-hidden ${
											isActive
												? 'border-ios-blue'
												: 'border-black/5 dark:border-white/10'
										} bg-[#f2f2f7] dark:bg-[#1c1c1e]`}
									>
										<button
											onClick={() => openTab(t.id)}
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
											<span className="block text-xs text-gray-400 truncate">
												{u ?? 'No page open'}
											</span>
										</button>
										<button
											onClick={() => closeTab(t.id)}
											aria-label={u ? `Close ${displayHost(u)}` : 'Close tab'}
											className="w-full py-2 text-xs text-gray-400 active:opacity-50 transition-opacity border-t border-black/5 dark:border-white/10"
										>
											Close
										</button>
									</div>
								);
							})}
						</div>
						<button
							onClick={addTab}
							aria-label="New tab"
							className="mt-4 w-full py-3 rounded-2xl border border-dashed border-black/10 dark:border-white/20 text-ios-blue text-base font-medium active:opacity-60 transition-opacity flex items-center justify-center gap-2"
						>
							<Plus aria-hidden="true" size={18} /> New Tab
						</button>
					</div>
				) : url === null ? (
					<div className="absolute inset-0 overflow-y-auto px-5 pt-10 pb-4">
						<h1 className="text-ios-large-title mb-4">Start Page</h1>
						<h2 className="text-sm font-semibold mb-2">Favorites</h2>
						<div className="grid grid-cols-4 gap-4 mb-6">
							{favorites.map(f => (
								<button
									key={f}
									onClick={() => navigate(f)}
									aria-label={`Open ${displayHost(f)}`}
									className="flex flex-col items-center gap-1.5 active:opacity-60 transition-opacity"
								>
									<span
										aria-hidden="true"
										className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/10 text-ios-blue text-xl font-semibold flex items-center justify-center"
									>
										{displayHost(f).charAt(0).toUpperCase()}
									</span>
									<span className="text-[11px] truncate w-full text-center">
										{displayHost(f)}
									</span>
								</button>
							))}
						</div>
						<div className="flex items-center justify-between mb-2">
							<h2 className="text-sm font-semibold">History</h2>
							{history.length > 0 && (
								<button
									onClick={clearHistory}
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
										onClick={() => navigate(h.url)}
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
				) : (
					<iframe
						key={`${active?.id ?? 'none'}:${url}:${reloadKey}`}
						src={url}
						title="Browser"
						sandbox="allow-scripts allow-forms allow-popups allow-downloads"
						className="absolute inset-0 w-full h-full border-0 bg-white"
						onLoad={() => setLoading(false)}
					/>
				)}
			</div>

			{/* Address pill */}
			<div className="shrink-0 px-3 pt-2">
				<div className="flex items-center rounded-full px-4 h-11 border backdrop-blur-2xl bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 shadow-lg">
					{editing ? (
						<input
							type="text"
							value={addressText}
							onChange={e => setAddressText(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') navigate(addressText);
								if (e.key === 'Escape') setEditing(false);
							}}
							placeholder="Search or enter website"
							aria-label="Address"
							autoFocus
							className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder-gray-400 min-w-0 text-center"
						/>
					) : (
						<button
							onClick={() => {
								setAddressText(url ?? '');
								setEditing(true);
							}}
							aria-label={url ? `Address: ${url}. Tap to edit.` : 'Search or enter website'}
							className="flex-1 text-[15px] truncate text-center active:opacity-60 transition-opacity"
						>
							{url ? displayHost(url) : <span className="text-gray-400">Search or enter website</span>}
						</button>
					)}
					{loading ? (
						<LoaderCircle aria-hidden="true" size={16} className="text-gray-400 ml-2 animate-spin shrink-0" />
					) : (
						url && (
							<button
								onClick={reload}
								aria-label="Reload page"
								className="ml-2 shrink-0 active:opacity-50 transition-opacity"
							>
								<RotateCw aria-hidden="true" size={16} className="text-gray-500" />
							</button>
						)
					)}
				</div>
			</div>

			{/* Bottom toolbar: back, forward, share, bookmark, tabs */}
			<div className="shrink-0 flex items-center justify-around px-6 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
				<button
					onClick={goBack}
					disabled={!active || active.hi <= 0}
					aria-label="Go back"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={24} />
				</button>
				<button
					onClick={goForward}
					disabled={!active || !url || active.hi >= active.history.length - 1}
					aria-label="Go forward"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronRight aria-hidden="true" size={24} />
				</button>
				<button
					onClick={openExternal}
					disabled={!url}
					aria-label="Open in browser"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<Share aria-hidden="true" size={22} />
				</button>
				<button
					onClick={toggleCurrentBookmark}
					disabled={!url}
					aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
					aria-pressed={saved}
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<Bookmark
						aria-hidden="true"
						size={22}
						className={saved ? 'text-ios-blue' : undefined}
						fill={saved ? 'currentColor' : 'none'}
					/>
				</button>
				<button
					onClick={() => {
						triggerHaptic('light');
						setOverview(true);
					}}
					aria-label={`Show ${tabs.length} tabs`}
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
				>
					<Copy aria-hidden="true" size={22} />
				</button>
			</div>
		</div>
	);
}
