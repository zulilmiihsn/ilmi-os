'use client';

import { ChevronLeft, Ellipsis, Search, X } from 'lucide-react';

interface FilesHeaderProps {
	activeTab: 'recents' | 'shared' | 'browse';
	canGoBack: boolean;
	currentPathName: string;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onBack: () => void;
	onOpenActionMenu: () => void;
	theme: {
		headerBg: string;
		text: string;
		activeTab: string;
		searchBg: string;
		searchPlaceholder: string;
	};
}

export default function FilesHeader({
	activeTab,
	canGoBack,
	currentPathName,
	searchQuery,
	onSearchChange,
	onBack,
	onOpenActionMenu,
	theme,
}: FilesHeaderProps) {
	const title =
		activeTab === 'recents' ? 'Recents' : activeTab === 'shared' ? 'Shared' : currentPathName;

	return (
		<div className={`shrink-0 border-b transition-colors ${theme.headerBg}`}>
			{/* Top Navigation */}
			<div className="relative flex items-center justify-between px-4 pt-3 pb-1">
				{/* Left Side */}
				<div className="flex items-center min-h-8">
					{canGoBack ? (
						<button
							type="button"
							onClick={onBack}
							className="flex items-center text-ios-blue text-base font-medium active:opacity-60 transition-opacity"
						>
							<ChevronLeft aria-hidden="true" className="w-5 h-5 -ml-1 mr-0.5" />
							<span>Browse</span>
						</button>
					) : null}
				</div>

				{/* Right Side */}
				<div className="flex items-center justify-end">
					<button
						type="button"
						onClick={onOpenActionMenu}
						aria-label="More actions"
						className="relative w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center active:scale-95 transition-all after:absolute after:-inset-1.5 after:content-['']"
					>
						<Ellipsis aria-hidden="true" className={`w-4 h-4 ${theme.activeTab}`} />
					</button>
				</div>
			</div>

			{/* Apple Large Title */}
			<div className="px-4 pb-2">
				<h1 className={`text-ios-large-title truncate ${theme.text}`}>{title}</h1>
			</div>

			{/* Search Bar */}
			<div className="px-4 pb-3">
				<div className={`relative flex items-center rounded-xl px-3 py-2 ${theme.searchBg}`}>
					<Search aria-hidden="true" className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
					<input
						type="text"
						placeholder="Search"
						aria-label="Search files"
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						className={`flex-1 bg-transparent border-none outline-none text-sm ${theme.text} ${theme.searchPlaceholder}`}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => onSearchChange('')}
							aria-label="Clear search"
							className="ml-2 p-0.5 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
						>
							<X aria-hidden="true" className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
