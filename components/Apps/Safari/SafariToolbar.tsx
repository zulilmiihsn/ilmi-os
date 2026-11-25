'use client';

import {
	Bookmark,
	ChevronLeft,
	ChevronRight,
	Copy,
	LoaderCircle,
	Lock,
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
	const isSecure = Boolean(url && url.startsWith('https://'));

	return (
		<div className="shrink-0 order-last md:order-first flex flex-col md:flex-row md:items-center md:gap-2 md:px-3 md:py-2 md:border-b md:border-black/10 md:dark:border-white/10 md:bg-[#f5f5f7]/90 md:dark:bg-[#1c1c1e]/90 md:backdrop-blur-2xl">
			{/* Address pill: top on mobile chrome, centered in desktop Safari bar */}
			<div className="shrink-0 px-3 pt-2 md:p-0 md:order-2 md:flex-1 md:max-w-xl md:mx-auto">
				<div className="flex items-center rounded-full md:rounded-lg px-4 md:px-3 h-11 md:h-8 border backdrop-blur-2xl bg-white/85 dark:bg-[#2c2c2e]/85 border-black/10 dark:border-white/15 shadow-lg md:shadow-none">
					{editing ? (
						<input
							id="safari-address-input"
							name="safari-address-input"
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
							className="flex-1 bg-transparent border-none outline-none text-[15px] md:text-xs placeholder-gray-400 min-w-0 text-center"
						/>
					) : (
						<button
							onClick={() => {
								setAddressText(url ?? '');
								setEditing(true);
							}}
							aria-label={url ? `Address: ${url}. Tap to edit.` : 'Search or enter website'}
							className="flex-1 flex items-center justify-center gap-1.5 text-[15px] md:text-xs truncate text-center active:opacity-60 transition-opacity min-w-0"
						>
							{isSecure && <Lock aria-hidden="true" size={11} className="text-gray-400 shrink-0" />}
							<span className="truncate">
								{url ? (
									displayHost(url)
								) : (
									<span className="text-gray-400">Search or enter website</span>
								)}
							</span>
						</button>
					)}
					{loading ? (
						<LoaderCircle
							aria-hidden="true"
							size={15}
							className="text-gray-400 ml-2 animate-spin shrink-0"
						/>
					) : (
						url && (
							<button
								onClick={onReload}
								aria-label="Reload page"
								className="ml-2 shrink-0 active:opacity-50 transition-opacity"
							>
								<RotateCw aria-hidden="true" size={14} className="text-gray-500" />
							</button>
						)
					)}
				</div>
			</div>

			{/* Action controls: bottom 5-icon bar on iOS, split left/right around address bar on macOS */}
			<div className="shrink-0 flex items-center justify-around px-6 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:contents">
				<div className="contents md:flex md:items-center md:gap-0.5 md:order-1">
					<button
						onClick={onGoBack}
						disabled={!active || active.hi <= 0}
						aria-label="Go back"
						className="relative w-11 h-11 md:w-8 md:h-8 md:rounded-md md:hover:bg-black/5 md:dark:hover:bg-white/10 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 md:after:inset-0 after:content-['']"
					>
						<ChevronLeft aria-hidden="true" size={22} className="md:w-4 md:h-4" />
					</button>
					<button
						onClick={onGoForward}
						disabled={!active || !url || active.hi >= active.history.length - 1}
						aria-label="Go forward"
						className="relative w-11 h-11 md:w-8 md:h-8 md:rounded-md md:hover:bg-black/5 md:dark:hover:bg-white/10 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 md:after:inset-0 after:content-['']"
					>
						<ChevronRight aria-hidden="true" size={22} className="md:w-4 md:h-4" />
					</button>
				</div>

				<div className="contents md:flex md:items-center md:gap-0.5 md:order-3">
					<button
						onClick={onOpenExternal}
						disabled={!url}
						aria-label="Open in browser"
						className="relative w-11 h-11 md:w-8 md:h-8 md:rounded-md md:hover:bg-black/5 md:dark:hover:bg-white/10 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 md:after:inset-0 after:content-['']"
					>
						<Share aria-hidden="true" size={20} className="md:w-4 md:h-4" />
					</button>
					<button
						onClick={onToggleBookmark}
						disabled={!url}
						aria-label={saved ? 'Remove bookmark' : 'Add bookmark'}
						aria-pressed={saved}
						className="relative w-11 h-11 md:w-8 md:h-8 md:rounded-md md:hover:bg-black/5 md:dark:hover:bg-white/10 flex items-center justify-center active:opacity-50 transition-opacity disabled:opacity-30 after:absolute after:-inset-2 md:after:inset-0 after:content-['']"
					>
						<Bookmark
							aria-hidden="true"
							size={20}
							className={`md:w-4 md:h-4 ${saved ? 'text-ios-blue' : ''}`}
							fill={saved ? 'currentColor' : 'none'}
						/>
					</button>
					<button
						onClick={onShowOverview}
						aria-label={`Show ${tabCount} tabs`}
						className="relative w-11 h-11 md:w-8 md:h-8 md:rounded-md md:hover:bg-black/5 md:dark:hover:bg-white/10 flex items-center justify-center active:opacity-50 transition-opacity after:absolute after:-inset-2 md:after:inset-0 after:content-['']"
					>
						<Copy aria-hidden="true" size={20} className="md:w-4 md:h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
