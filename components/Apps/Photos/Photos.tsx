'use client';

import { usePhotos } from './hooks/usePhotos';
import PhotosSidebar from './components/PhotosSidebar';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewerModal from './components/PhotoViewerModal';
import { triggerHaptic } from '../../../utils/haptic';

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

	const tabs: { id: 'library' | 'foryou' | 'albums' | 'search'; label: string; icon: string }[] = [
		{ id: 'library', label: 'Library', icon: 'fas fa-images' },
		{ id: 'foryou', label: 'For You', icon: 'fas fa-heart' },
		{ id: 'albums', label: 'Albums', icon: 'fas fa-folder-open' },
		{ id: 'search', label: 'Search', icon: 'fas fa-search' },
	];

	return (
		<div className="photos w-full h-full flex relative overflow-hidden bg-[#f2f2f7] dark:bg-black text-black dark:text-white select-none transition-colors">
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
				<div className="pt-10 px-5 pb-2 bg-[#f2f2f7] dark:bg-black shrink-0">
					<div className="flex items-baseline justify-between mb-1">
						<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
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
				<div className="md:hidden absolute bottom-5 left-4 right-4 z-20 flex justify-center pointer-events-none">
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
									className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
										isActive
											? 'text-[#007aff]'
											: 'text-gray-400 dark:text-gray-500'
									}`}
								>
									<i className={`${tab.icon} text-base mb-0.5`}></i>
									<span className="text-[10px] font-medium tracking-tight">
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
