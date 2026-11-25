'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
	AlertCircle,
	Camera,
	ChevronLeft,
	Folder,
	Heart,
	Image as ImageIcon,
	Plus,
	Search,
	Upload,
	X,
} from 'lucide-react';
import { usePhotos } from './hooks/usePhotos';
import PhotosSidebar from './components/PhotosSidebar';
import PhotoGrid from './components/PhotoGrid';
import PhotoViewerModal from './components/PhotoViewerModal';
import { triggerHaptic } from '../../../utils/haptic';
import type { Album, PhotosTab, ViewMode } from './types';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
	{ id: 'years', label: 'Years' },
	{ id: 'months', label: 'Months' },
	{ id: 'days', label: 'Days' },
	{ id: 'all', label: 'All' },
];

function renderTabIcon(id: PhotosTab, isActive: boolean) {
	const className = `w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.1]' : 'stroke-[1.6]'}`;
	switch (id) {
		case 'library':
			return <ImageIcon aria-hidden="true" className={className} />;
		case 'foryou':
			return <Heart aria-hidden="true" className={className} />;
		case 'albums':
			return <Folder aria-hidden="true" className={className} />;
		case 'search':
			return <Search aria-hidden="true" className={className} />;
	}
}

function AlbumCardsGrid({
	albums,
	onSelectAlbum,
}: {
	albums: Album[];
	onSelectAlbum: (album: Album) => void;
}) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
			{albums.map(album => (
				<button
					key={album.id}
					type="button"
					onClick={() => onSelectAlbum(album)}
					className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue rounded-xl active:scale-[0.98] transition-transform"
				>
					<div className="aspect-square relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 mb-2 flex items-center justify-center">
						{album.image ? (
							<Image
								src={album.image}
								alt={album.title}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
								unoptimized
							/>
						) : (
							<ImageIcon aria-hidden="true" className="w-8 h-8 text-gray-400 dark:text-gray-500" />
						)}
					</div>
					<p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
						{album.title}
					</p>
					<p className="text-[11px] text-gray-500 dark:text-gray-400">{album.count}</p>
				</button>
			))}
		</div>
	);
}

export default function Photos() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const {
		activeTab,
		setActiveTab,
		viewMode,
		setViewMode,
		selectedAlbum,
		setSelectedAlbum,
		selectedPhoto,
		setSelectedPhotoId,
		searchQuery,
		setSearchQuery,
		albums,
		currentDisplayPhotos,
		storageError,
		clearStorageError,
		isImporting,
		handleToggleFavorite,
		handleDeletePhoto,
		handleImportFiles,
		selectPrevPhoto,
		selectNextPhoto,
		hasPrevPhoto,
		hasNextPhoto,
	} = usePhotos();

	const title =
		selectedAlbum ??
		(activeTab === 'library'
			? 'Library'
			: activeTab === 'foryou'
				? 'For You'
				: activeTab === 'albums'
					? 'Albums'
					: 'Search');

	const tabs: { id: PhotosTab; label: string }[] = [
		{ id: 'library', label: 'Library' },
		{ id: 'foryou', label: 'For You' },
		{ id: 'albums', label: 'Albums' },
		{ id: 'search', label: 'Search' },
	];

	const openCameraApp = () => {
		triggerHaptic('light');
		window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'camera' }));
	};

	const triggerImport = () => {
		fileInputRef.current?.click();
	};

	const showAlbumsOverview = activeTab === 'albums' && selectedAlbum === null;
	const itemCountLabel = showAlbumsOverview
		? `${albums.length} Albums`
		: `${currentDisplayPhotos.length} ${currentDisplayPhotos.length === 1 ? 'Photo' : 'Photos'}`;

	const emptyCopy = (() => {
		if (activeTab === 'search' && searchQuery.trim()) {
			return {
				title: 'No Results',
				description: `No photos matched "${searchQuery.trim()}". Try searching by date, "camera", or "favorite".`,
				showActions: false,
			};
		}
		if (selectedAlbum === 'Favorites' || activeTab === 'foryou') {
			return {
				title: 'No Favorites Yet',
				description: 'Tap the heart on any photo to add it to your Favorites.',
				showActions: false,
			};
		}
		if (selectedAlbum === 'Imports') {
			return {
				title: 'No Imported Photos',
				description: 'Import photos from your device to view them in this album.',
				showActions: true,
			};
		}
		return {
			title: 'No Photos',
			description: 'Take photos in Camera or import images from your device.',
			showActions: true,
		};
	})();

	return (
		<div className="photos w-full h-full flex relative overflow-hidden font-sans bg-[#f2f2f7] dark:bg-[#0d0d0f] text-black dark:text-white select-none transition-colors">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				aria-label="Import photos from device"
				onChange={e => {
					const files = e.target.files;
					if (files && files.length > 0) {
						void handleImportFiles(files);
					}
					e.target.value = '';
				}}
			/>

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
				<div className="pt-3 md:pt-5 px-4 pb-2.5 bg-[#f2f2f7] dark:bg-[#0d0d0f] shrink-0">
					{selectedAlbum && (
						<button
							type="button"
							onClick={() => setSelectedAlbum(null)}
							className="md:hidden inline-flex items-center gap-0.5 text-ios-blue text-xs font-medium mb-1 active:opacity-70"
						>
							<ChevronLeft aria-hidden="true" className="w-4 h-4" />
							<span>Albums</span>
						</button>
					)}
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<h1 className="text-ios-large-title truncate">{title}</h1>
							<p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
								{itemCountLabel}
							</p>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							<button
								type="button"
								onClick={openCameraApp}
								aria-label="Open Camera"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-medium text-gray-800 dark:text-gray-100 active:scale-[0.98] transition-all"
							>
								<Camera aria-hidden="true" className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">Camera</span>
							</button>
							<button
								type="button"
								onClick={triggerImport}
								disabled={isImporting}
								aria-label="Import photos"
								className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ios-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
							>
								{isImporting ? (
									<Upload aria-hidden="true" className="w-3.5 h-3.5 animate-pulse" />
								) : (
									<Plus aria-hidden="true" className="w-3.5 h-3.5" />
								)}
								<span>{isImporting ? 'Importing...' : 'Import'}</span>
							</button>
						</div>
					</div>

					{/* Library View Mode Segmented Control */}
					{activeTab === 'library' && selectedAlbum === null && (
						<div className="mt-2.5 flex justify-center sm:justify-start">
							<div
								role="tablist"
								aria-label="Library grouping"
								className="inline-flex items-center p-0.5 rounded-full bg-black/5 dark:bg-white/10"
							>
								{VIEW_MODES.map(m => {
									const isActive = viewMode === m.id;
									return (
										<button
											key={m.id}
											type="button"
											role="tab"
											aria-selected={isActive}
											onClick={() => {
												triggerHaptic('light');
												setViewMode(m.id);
											}}
											className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
												isActive
													? 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs'
													: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
											}`}
										>
											{m.label}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Search Input when in Search tab */}
					{activeTab === 'search' && selectedAlbum === null && (
						<div className="mt-3 relative">
							<Search
								aria-hidden="true"
								className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
							/>
							<input
								type="search"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder="Photos by date, camera, import, favorite..."
								aria-label="Search photos"
								className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery('')}
									aria-label="Clear photo search"
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
								>
									<X aria-hidden="true" className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					)}

					{/* Storage Error Banner */}
					{storageError && (
						<div
							role="alert"
							className="mt-2.5 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs"
						>
							<div className="flex items-center gap-2 min-w-0">
								<AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
								<span className="truncate">{storageError}</span>
							</div>
							<button
								type="button"
								onClick={clearStorageError}
								aria-label="Dismiss error"
								className="p-0.5 rounded hover:bg-red-500/15 shrink-0"
							>
								<X aria-hidden="true" className="w-3.5 h-3.5" />
							</button>
						</div>
					)}
				</div>

				{/* Grid / Albums Scroll Area */}
				<div className="flex-1 overflow-y-auto px-1 pb-24 md:pb-6">
					{showAlbumsOverview ? (
						<AlbumCardsGrid
							albums={albums}
							onSelectAlbum={album => {
								triggerHaptic('light');
								setSelectedAlbum(album.id);
							}}
						/>
					) : (
						<PhotoGrid
							photos={currentDisplayPhotos}
							viewMode={activeTab === 'library' && selectedAlbum === null ? viewMode : 'all'}
							onSelectPhoto={photo => {
								triggerHaptic('light');
								setSelectedPhotoId(photo.id);
							}}
							onOpenCamera={openCameraApp}
							onTriggerImport={triggerImport}
							emptyTitle={emptyCopy.title}
							emptyDescription={emptyCopy.description}
							showEmptyActions={emptyCopy.showActions}
						/>
					)}
				</div>

				{/* iOS Floating Liquid Glass Tab Bar */}
				<div className="md:hidden pb-safe absolute bottom-3 left-4 right-4 z-20 flex justify-center pointer-events-none">
					<div
						role="tablist"
						aria-label="Photos navigation"
						className="w-full max-w-[340px] px-3 py-2 rounded-full backdrop-blur-2xl flex items-center justify-around border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 pointer-events-auto"
					>
						{tabs.map(tab => {
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={isActive}
									onClick={() => {
										triggerHaptic('light');
										setSelectedAlbum(null);
										setActiveTab(tab.id);
									}}
									className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 after:absolute after:-inset-y-0.5 after:content-[''] ${
										isActive ? 'text-ios-blue' : 'text-ios-gray'
									}`}
								>
									{renderTabIcon(tab.id, isActive)}
									<span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Fullscreen Photo Viewer */}
			<PhotoViewerModal
				photo={selectedPhoto}
				onClose={() => setSelectedPhotoId(null)}
				onToggleFavorite={handleToggleFavorite}
				onDelete={handleDeletePhoto}
				onPrev={selectPrevPhoto}
				onNext={selectNextPhoto}
				hasPrev={hasPrevPhoto}
				hasNext={hasNextPhoto}
			/>
		</div>
	);
}
