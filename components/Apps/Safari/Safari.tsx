'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	DEFAULT_FAVORITES,
	currentUrl,
	displayHost,
	extractSearchQuery,
	isLikelyFrameBlocked,
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
import { SafariTabOverview } from './SafariTabOverview';
import { SafariStartPage } from './SafariStartPage';
import { SafariToolbar } from './SafariToolbar';
import { SafariSearchView } from './SafariSearchView';

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

	const handleSearchLoaded = useCallback(() => setLoading(false), []);
	const searchQuery = url ? extractSearchQuery(url) : null;
	const frameBlockedHint = url && !searchQuery ? isLikelyFrameBlocked(url) : false;

	const favorites = [
		...DEFAULT_FAVORITES,
		...bookmarks.filter(b => !DEFAULT_FAVORITES.includes(b)),
	];
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
					Could not save browsing data. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			{/* Web area / start page / search / overview */}
			<div className="flex-1 relative overflow-hidden flex flex-col">
				{overview ? (
					<SafariTabOverview
						tabs={tabs}
						active={active}
						onDone={() => setOverview(false)}
						onOpenTab={openTab}
						onCloseTab={closeTab}
						onAddTab={addTab}
					/>
				) : url === null ? (
					<SafariStartPage
						favorites={favorites}
						history={history}
						darkMode={darkMode}
						onNavigate={navigate}
						onClearHistory={clearHistory}
					/>
				) : searchQuery ? (
					<SafariSearchView
						key={`${active?.id ?? 'none'}:${searchQuery}:${reloadKey}`}
						query={searchQuery}
						darkMode={darkMode}
						onNavigate={navigate}
						onLoaded={handleSearchLoaded}
					/>
				) : (
					<>
						{frameBlockedHint && (
							<div className="shrink-0 z-10 px-3 py-1.5 text-xs flex items-center justify-between gap-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border-b border-black/10 dark:border-white/10">
								<span className="truncate text-gray-600 dark:text-gray-300">
									{displayHost(url)} restricts embedded previews in browsers.
								</span>
								<button
									type="button"
									onClick={openExternal}
									className="inline-flex items-center gap-1 font-medium text-ios-blue shrink-0 hover:underline"
								>
									Open Tab <ExternalLink aria-hidden="true" size={11} />
								</button>
							</div>
						)}
						<div className="flex-1 relative">
							<iframe
								key={`${active?.id ?? 'none'}:${url}:${reloadKey}`}
								src={url}
								title="Browser"
								sandbox="allow-scripts allow-forms allow-popups allow-downloads"
								className="absolute inset-0 w-full h-full border-0 bg-white"
								onLoad={() => setLoading(false)}
							/>
						</div>
					</>
				)}
			</div>

			<SafariToolbar
				active={active}
				url={url}
				editing={editing}
				addressText={addressText}
				loading={loading}
				saved={saved}
				tabCount={tabs.length}
				setAddressText={setAddressText}
				setEditing={setEditing}
				onNavigate={navigate}
				onReload={reload}
				onGoBack={goBack}
				onGoForward={goForward}
				onOpenExternal={openExternal}
				onToggleBookmark={toggleCurrentBookmark}
				onShowOverview={() => {
					triggerHaptic('light');
					setOverview(true);
				}}
			/>
		</div>
	);
}
