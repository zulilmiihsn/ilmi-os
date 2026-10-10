'use client';

import { usePhotos } from './hooks/usePhotos';
import PhotosSidebar from './components/PhotosSidebar';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewerModal from './components/PhotoViewerModal';
import { triggerHaptic } from '../../../utils/haptic';

type PhotosTabId = 'library' | 'foryou' | 'albums' | 'search';

function renderTabIcon(id: PhotosTabId, isActive: boolean) {
	const className = 'w-6 h-6 mb-0.5';
	const common = {
		className,
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: isActive ? 2 : 1.5,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		viewBox: '0 0 24 24',
		'aria-hidden': true,
	} as const;
	switch (id) {
		case 'library':
			return (
				<svg {...common}>
					<rect x="4" y="5" width="16" height="13" rx="2.5" />
					<circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
					<path d="M4.5 15.5l4.5-4 3 3 3.5-3.5 4 4" />
				</svg>
			);
		case 'foryou':
			return (
				<svg {...common}>
					<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
				</svg>
			);
		case 'albums':
			return (
				<svg {...common}>
					<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
				</svg>
			);
		case 'search':
			return (
				<svg {...common}>
					<circle cx="11" cy="11" r="6.5" />
					<path d="M15.8 15.8L20.5 20.5" />
				</svg>
			);
	}
}

export default function Photos() {
	const {
		activeTab,
		setActiveTab,
		selectedAlbum,
		setSelectedAlbum,
		selectedImage,
		setSelectedImage,
		albums,
		currentDisplayPhotos,
	} = usePhotos();

	const title = selectedAlbum || (activeTab === 'library' ? 'Library' : activeTab === 'foryou' ? 'For You' : activeTab === 'albums' ? 'Albums' : 'Search');

	const tabs: { id: PhotosTabId; label: string }[] = [
		{ id: 'library', label: 'Library' },
		{ id: 'foryou', label: 'For You' },
		{ id: 'albums', label: 'Albums' },
		{ id: 'search', label: 'Search' },
	];

	return (
		<div className="photos w-full h-full flex relative overflow-hidden font-sans bg-[#f2f2f7] dark:bg-black text-black dark:text-white select-none transition-colors">
			{/* macOS Desktop Sidebar */}
			<PhotosSidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				selectedAlbum={selectedAlbum}
				setSelectedAlbum={setSelectedAlbum}
				albums={albums}
			/>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden relative">
				{/* Top Bar Header */}
				<div className="pt-10 px-4 pb-2 bg-[#f2f2f7] dark:bg-black shrink-0">
					<div className="flex items-baseline justify-between mb-1">
						<h1 className="text-ios-large-title">{title}</h1>
						<span className="text-xs text-gray-400 font-medium">{currentDisplayPhotos.length} Photos</span>
					</div>
				</div>

				{/* Grid Scroll Area */}
				<div className="flex-1 overflow-y-auto px-1 pb-24">
					<PhotoGrid
						photos={currentDisplayPhotos}
						onSelectPhoto={img => {
							triggerHaptic('light');
							setSelectedImage(img);
						}}
					/>
				</div>

				{/* iOS 26 Floating Liquid Glass Tab Bar */}
				<div className="md:hidden absolute bottom-[max(env(safe-area-inset-bottom),1.25rem)] left-4 right-4 z-20 flex justify-center pointer-events-none">
					<div className="w-full max-w-[340px] px-3 py-2 rounded-full backdrop-blur-2xl flex items-center justify-around border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 pointer-events-auto">
						{tabs.map(tab => {
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									onClick={() => {
										triggerHaptic('light');
										setSelectedAlbum(null);
										setActiveTab(tab.id);
									}}
									className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 after:absolute after:-inset-y-0.5 after:content-[''] ${
										isActive
											? 'text-ios-blue'
											: 'text-ios-gray'
									}`}
								>
									{renderTabIcon(tab.id, isActive)}
									<span className="text-[11px] font-medium tracking-tight">
										{tab.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Fullscreen Photo Viewer */}
			<PhotoViewerModal
				imageUrl={selectedImage}
				onClose={() => setSelectedImage(null)}
			/>
		</div>
	);
}
