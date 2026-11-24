'use client';

import {
	Bookmark,
	ChevronLeft,
	ChevronRight,
	Copy,
	LoaderCircle,
	RotateCw,
	Share,
} from 'lucide-react';
import { displayHost, type BrowserTab } from './browsing';

interface SafariToolbarProps {
	active: BrowserTab | null;
	url: string | null;
	editing: boolean;
	addressText: string;
	loading: boolean;
	saved: boolean;
	tabCount: number;
	setAddressText: (text: string) => void;
	setEditing: (editing: boolean) => void;
	onNavigate: (raw: string) => void;
	onReload: () => void;
	onGoBack: () => void;
	onGoForward: () => void;
	onOpenExternal: () => void;
	onToggleBookmark: () => void;
	onShowOverview: () => void;
}

export function SafariToolbar({
	active,
	url,
	editing,
	addressText,
	loading,
	saved,
	tabCount,
	setAddressText,
	setEditing,
	onNavigate,
	onReload,
	onGoBack,
	onGoForward,
	onOpenExternal,
	onToggleBookmark,
	onShowOverview,
}: SafariToolbarProps) {
	return (
		<>
			{/* Address pill */}
			<div className="shrink-0 px-3 pt-2">
				<div className="flex items-center rounded-full px-4 h-11 border backdrop-blur-2xl bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 shadow-lg">
					{editing ? (
						<input
							type="text"
							value={addressText}
							onChange={e => setAddressText(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') onNavigate(addressText);
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
							{url ? (
								displayHost(url)
							) : (
								<span className="text-gray-400">Search or enter website</span>
							)}
						</button>
					)}
					{loading ? (
						<LoaderCircle
							aria-hidden="true"
							size={16}
							className="text-gray-400 ml-2 animate-spin shrink-0"
						/>
					) : (
						url && (
							<button
								onClick={onReload}
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
					onClick={onGoBack}
					disabled={!active || active.hi <= 0}
					aria-label="Go back"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={24} />
				</button>
				<button
					onClick={onGoForward}
					disabled={!active || !url || active.hi >= active.history.length - 1}
					aria-label="Go forward"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronRight aria-hidden="true" size={24} />
				</button>
				<button
					onClick={onOpenExternal}
					disabled={!url}
					aria-label="Open in browser"
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 after:content-['']"
				>
					<Share aria-hidden="true" size={22} />
				</button>
				<button
					onClick={onToggleBookmark}
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
					onClick={onShowOverview}
					aria-label={`Show ${tabCount} tabs`}
					className="relative w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
				>
					<Copy aria-hidden="true" size={22} />
				</button>
			</div>
		</>
	);
}
