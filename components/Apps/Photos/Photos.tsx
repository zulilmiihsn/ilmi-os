'use client';

import { usePhotos } from './hooks/usePhotos';
import PhotosSidebar from './components/PhotosSidebar';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewerModal from './components/PhotoViewerModal';

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

	return (
		<div className="photos w-full h-full flex relative overflow-hidden bg-white dark:bg-[#1E1E1E] text-black dark:text-white select-none transition-colors">
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
				<div className="h-12 bg-white/90 dark:bg-[#282828]/90 backdrop-blur-md border-b border-gray-200 dark:border-black/50 flex items-center justify-between px-4 shrink-0">
					<h1 className="font-semibold text-sm tracking-tight">{title}</h1>
					<span className="text-xs text-gray-400 font-normal">{currentDisplayPhotos.length} Photos</span>
				</div>

				{/* Grid Scroll Area */}
				<div className="flex-1 overflow-y-auto pb-16 md:pb-4">
					<PhotoGrid
						photos={currentDisplayPhotos}
						onSelectPhoto={img => setSelectedImage(img)}
					/>
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
