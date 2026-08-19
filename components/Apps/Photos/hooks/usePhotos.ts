'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PhotosTab, ViewMode, LocalPhoto, Album } from '../types';

const MOCK_PHOTOS = [
	'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
	'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=400&fit=crop',
];

export function usePhotos() {
	const [activeTab, setActiveTab] = useState<PhotosTab>('albums');
	const [viewMode, setViewMode] = useState<ViewMode>('all');
	const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [localPhotos, setLocalPhotos] = useState<string[]>([]);

	const loadLocalPhotos = useCallback(() => {
		try {
			const stored = localStorage.getItem('camera_photos');
			if (stored) {
				const parsed: LocalPhoto[] = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					setLocalPhotos(parsed.map(p => p.url));
				}
			}
		} catch {
			// Silent fail
		}
	}, []);

	useEffect(() => {
		loadLocalPhotos();
		window.addEventListener('storage', loadLocalPhotos);
		return () => window.removeEventListener('storage', loadLocalPhotos);
	}, [loadLocalPhotos]);

	const allPhotos = useMemo(() => {
		return [...localPhotos, ...MOCK_PHOTOS];
	}, [localPhotos]);

	const albums: Album[] = useMemo(() => {
		return [
			{ title: 'Recents', count: allPhotos.length + 461, image: allPhotos[0] || MOCK_PHOTOS[0] },
			{ title: 'Great Shots', count: 36, image: MOCK_PHOTOS[1] },
			{ title: 'Favorites', count: 72, image: MOCK_PHOTOS[2] },
			{ title: 'HDR Video', count: 23, image: MOCK_PHOTOS[3] },
			{ title: 'Instagram', count: 105, image: MOCK_PHOTOS[4] },
			{ title: 'WhatsApp', count: 890, image: MOCK_PHOTOS[5] },
		];
	}, [allPhotos]);

	const currentDisplayPhotos = useMemo(() => {
		if (selectedAlbum === 'Favorites') return MOCK_PHOTOS.slice(0, 5);
		if (selectedAlbum === 'Great Shots') return MOCK_PHOTOS.slice(5, 10);
		if (selectedAlbum && selectedAlbum !== 'Recents') return MOCK_PHOTOS.slice(0, 3);
		return allPhotos;
	}, [selectedAlbum, allPhotos]);

	return {
		activeTab,
		setActiveTab,
		viewMode,
		setViewMode,
		selectedAlbum,
		setSelectedAlbum,
		selectedImage,
		setSelectedImage,
		allPhotos,
		albums,
		currentDisplayPhotos,
	};
}
