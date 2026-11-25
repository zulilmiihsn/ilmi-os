'use client';

import Image from 'next/image';
import { Camera, Folder, Heart, Image as ImageIcon, Search, Upload } from 'lucide-react';
import type { Album, AlbumId, PhotosTab } from '../types';

interface PhotosSidebarProps {
	activeTab: PhotosTab;
	setActiveTab: (tab: PhotosTab) => void;
	selectedAlbum: AlbumId | null;
	setSelectedAlbum: (album: AlbumId | null) => void;
	albums: Album[];
}

function renderAlbumFallbackIcon(id: AlbumId, isSelected: boolean) {
	const className = `w-3 h-3 ${isSelected ? 'text-white/90' : 'text-gray-400 dark:text-gray-500'}`;
	switch (id) {
		case 'Favorites':
			return <Heart aria-hidden="true" className={className} />;
		case 'Camera':
			return <Camera aria-hidden="true" className={className} />;
		case 'Imports':
			return <Upload aria-hidden="true" className={className} />;
		case 'Recents':
			return <ImageIcon aria-hidden="true" className={className} />;
	}
}

export default function PhotosSidebar({
	activeTab,
	setActiveTab,
	selectedAlbum,
	setSelectedAlbum,
	albums,
}: PhotosSidebarProps) {
	const navItems: { id: PhotosTab; label: string; icon: React.ReactNode }[] = [
		{
			id: 'library',
			label: 'Library',
			icon: <ImageIcon aria-hidden="true" className="w-4 h-4 shrink-0" />,
		},
		{
			id: 'foryou',
			label: 'For You',
			icon: <Heart aria-hidden="true" className="w-4 h-4 shrink-0" />,
		},
		{
			id: 'albums',
			label: 'Albums',
			icon: <Folder aria-hidden="true" className="w-4 h-4 shrink-0" />,
		},
		{
			id: 'search',
			label: 'Search',
			icon: <Search aria-hidden="true" className="w-4 h-4 shrink-0" />,
		},
	];

	return (
		<aside className="hidden md:flex flex-col w-56 h-full border-r border-gray-200/80 dark:border-white/10 bg-[#f6f6f6]/85 dark:bg-[#1c1c1e]/85 backdrop-blur-xl shrink-0">
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
									type="button"
									onClick={() => {
										setActiveTab(item.id);
										setSelectedAlbum(null);
									}}
									className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors ${
										isActive
											? 'bg-ios-blue text-white'
											: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
									}`}
								>
									{item.icon}
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
						const isSelected = selectedAlbum === album.id;
						return (
							<li key={album.id}>
								<button
									type="button"
									onClick={() => {
										setActiveTab('albums');
										setSelectedAlbum(album.id);
									}}
									className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors ${
										isSelected
											? 'bg-ios-blue text-white'
											: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
									}`}
								>
									<div
										className={`w-5 h-5 rounded overflow-hidden relative shrink-0 flex items-center justify-center ${
											isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
										}`}
									>
										{album.image ? (
											<Image src={album.image} alt="" fill className="object-cover" unoptimized />
										) : (
											renderAlbumFallbackIcon(album.id, isSelected)
										)}
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
		</aside>
	);
}
