'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateId } from '../../../../utils/id';
import {
	appendPhoto,
	compressImageFile,
	deletePhoto,
	loadPhotos,
	subscribePhotosChanged,
	togglePhotoFavorite,
	type StoredPhoto,
} from '../../../../utils/photoStorage';
import { buildPhotoAlbums, resolveDisplayedPhotos } from '../photoHelpers';
import type { Album, AlbumId, PhotosTab, ViewMode } from '../types';

export function usePhotos() {
	const [activeTab, setActiveTab] = useState<PhotosTab>('library');
	const [viewMode, setViewMode] = useState<ViewMode>('all');
	const [selectedAlbum, setSelectedAlbum] = useState<AlbumId | null>(null);
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [photos, setPhotos] = useState<StoredPhoto[]>([]);
	const [storageError, setStorageError] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	const reloadPhotos = useCallback(() => {
		const result = loadPhotos();
		setPhotos(result.photos);
		if (result.status === 'corrupted' || result.status === 'unavailable') {
			setStorageError(result.message);
		} else {
			setStorageError(null);
		}
	}, []);

	useEffect(() => {
		reloadPhotos();
		return subscribePhotosChanged(reloadPhotos);
	}, [reloadPhotos]);

	const albums: Album[] = useMemo(() => buildPhotoAlbums(photos), [photos]);

	const currentDisplayPhotos = useMemo(
		() => resolveDisplayedPhotos(photos, activeTab, selectedAlbum, searchQuery),
		[photos, activeTab, selectedAlbum, searchQuery]
	);

	const selectedIndex = useMemo(() => {
		if (!selectedPhotoId) return -1;
		return currentDisplayPhotos.findIndex(p => p.id === selectedPhotoId);
	}, [currentDisplayPhotos, selectedPhotoId]);

	const selectedPhoto: StoredPhoto | null = useMemo(() => {
		if (!selectedPhotoId) return null;
		return (
			currentDisplayPhotos.find(p => p.id === selectedPhotoId) ??
			photos.find(p => p.id === selectedPhotoId) ??
			null
		);
	}, [currentDisplayPhotos, photos, selectedPhotoId]);

	const handleToggleFavorite = useCallback((id: string) => {
		const res = togglePhotoFavorite(id);
		if (!res.ok) {
			setStorageError(res.message);
			return;
		}
		setStorageError(null);
	}, []);

	const handleDeletePhoto = useCallback(
		(id: string) => {
			const idx = currentDisplayPhotos.findIndex(p => p.id === id);
			const res = deletePhoto(id);
			if (!res.ok) {
				setStorageError(res.message);
				return;
			}
			setStorageError(null);
			if (selectedPhotoId === id) {
				const nextCandidate =
					currentDisplayPhotos[idx + 1] ?? currentDisplayPhotos[idx - 1] ?? null;
				setSelectedPhotoId(nextCandidate ? nextCandidate.id : null);
			}
		},
		[currentDisplayPhotos, selectedPhotoId]
	);

	const handleImportFiles = useCallback(async (fileList: FileList | File[]) => {
		const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
		if (files.length === 0) {
			setStorageError('Please select valid image files.');
			return;
		}

		setIsImporting(true);
		setStorageError(null);
		try {
			for (const file of files) {
				const dataUrl = await compressImageFile(file);
				const res = appendPhoto({
					id: generateId('photo'),
					url: dataUrl,
					date: new Date().toISOString(),
					type: 'photo',
					source: 'import',
					isFavorite: false,
					title: file.name,
				});
				if (!res.ok) {
					setStorageError(res.message);
					break;
				}
			}
		} catch (error) {
			setStorageError(error instanceof Error ? error.message : 'Failed to import photo.');
		} finally {
			setIsImporting(false);
		}
	}, []);

	const selectPrevPhoto = useCallback(() => {
		if (selectedIndex > 0) {
			const prev = currentDisplayPhotos[selectedIndex - 1];
			if (prev) setSelectedPhotoId(prev.id);
		}
	}, [currentDisplayPhotos, selectedIndex]);

	const selectNextPhoto = useCallback(() => {
		if (selectedIndex >= 0 && selectedIndex < currentDisplayPhotos.length - 1) {
			const next = currentDisplayPhotos[selectedIndex + 1];
			if (next) setSelectedPhotoId(next.id);
		}
	}, [currentDisplayPhotos, selectedIndex]);

	const clearStorageError = useCallback(() => setStorageError(null), []);

	return {
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
		allPhotos: photos,
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
		hasPrevPhoto: selectedIndex > 0,
		hasNextPhoto: selectedIndex >= 0 && selectedIndex < currentDisplayPhotos.length - 1,
	};
}
