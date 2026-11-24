'use client';

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
	return (
		<div className={`shrink-0 border-b transition-colors ${theme.headerBg}`}>
			{/* Top Navigation */}
			<div className="relative flex items-center justify-between px-4 pt-6 pb-2">
				{/* Left Side */}
				<div className="flex-1 flex items-center">
					{canGoBack ? (
						<button
							onClick={onBack}
							className="flex items-center text-ios-blue text-base font-medium"
						>
							<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Browse
						</button>
					) : null}
				</div>

				{/* Center Title */}
				<h1
					className={`text-lg font-semibold text-center mx-2 truncate max-w-[60%] ${theme.text}`}
				>
					{activeTab === 'recents'
						? 'Recents'
						: activeTab === 'shared'
							? 'Shared'
							: currentPathName}
				</h1>

				{/* Right Side */}
				<div className="flex-1 flex items-center justify-end">
					<button
						onClick={onOpenActionMenu}
						aria-label="More actions"
						className="relative w-8 h-8 flex items-center justify-center after:absolute after:-inset-1.5 after:content-['']"
					>
						<svg
							aria-hidden="true"
							className={`w-5 h-5 ${theme.activeTab}`}
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
						</svg>
					</button>
				</div>
			</div>

			{/* Search Bar */}
			<div className="px-4 pb-3">
				<div className={`relative flex items-center rounded-lg px-3 py-2 ${theme.searchBg}`}>
					<svg
						aria-hidden="true"
						className="w-4 h-4 text-gray-500 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						placeholder="Search"
						aria-label="Search files"
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						className={`flex-1 bg-transparent border-none outline-none text-sm ${theme.text} ${theme.searchPlaceholder}`}
					/>
					<span className="ml-2" aria-hidden="true">
						<svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
						</svg>
					</span>
				</div>
			</div>
		</div>
	);
}
