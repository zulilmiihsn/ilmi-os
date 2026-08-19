'use client';

import Image from 'next/image';
import type { PhotosTab, Album } from '../types';

interface PhotosSidebarProps {
	activeTab: PhotosTab;
	setActiveTab: (tab: PhotosTab) => void;
	selectedAlbum: string | null;
	setSelectedAlbum: (album: string | null) => void;
	albums: Album[];
}

export default function PhotosSidebar({
	activeTab,
	setActiveTab,
	selectedAlbum,
	setSelectedAlbum,
	albums,
}: PhotosSidebarProps) {
	const navItems: { id: PhotosTab; label: string; icon: string }[] = [
		{ id: 'library', label: 'Library', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
		{ id: 'foryou', label: 'For You', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
		{ id: 'albums', label: 'Albums', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
		{ id: 'search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
	];

	return (
		<div className="hidden md:flex flex-col w-56 h-full border-r border-gray-200 dark:border-black/50 bg-[#F6F6F6]/80 dark:bg-[#252525]/80 backdrop-blur-md shrink-0">
			<div className="p-3 pt-4">
				<h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1.5 tracking-wider">
					Photos
				</h2>
				<ul className="space-y-0.5">
					{navItems.map(item => {
						const isActive = activeTab === item.id && selectedAlbum === null;
						return (
							<li key={item.id}>
								<button
									onClick={() => {
										setActiveTab(item.id);
										setSelectedAlbum(null);
									}}
									className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors ${
										isActive
											? 'bg-blue-500 text-white'
											: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
									}`}
								>
									<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
									</svg>
									<span>{item.label}</span>
								</button>
							</li>
						);
					})}
				</ul>
			</div>

			<div className="p-3 pt-1 flex-1 overflow-y-auto">
				<h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1.5 tracking-wider">
					My Albums
				</h2>
				<ul className="space-y-0.5">
					{albums.map(album => {
						const isSelected = selectedAlbum === album.title;
						return (
							<li key={album.title}>
								<button
									onClick={() => {
										setActiveTab('albums');
										setSelectedAlbum(album.title);
									}}
									className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors ${
										isSelected
											? 'bg-blue-500 text-white'
											: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
									}`}
								>
									<div className="w-5 h-5 rounded overflow-hidden relative shrink-0">
										<Image src={album.image} alt="" fill className="object-cover" unoptimized />
									</div>
									<span className="truncate flex-1">{album.title}</span>
									<span className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
										{album.count}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
