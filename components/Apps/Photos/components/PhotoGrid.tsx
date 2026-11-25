'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Camera, Heart, Image as ImageIcon, Upload } from 'lucide-react';
import type { LocalPhoto, ViewMode } from '../types';
import { formatPhotoDate } from '../photoHelpers';

interface PhotoGridProps {
	photos: LocalPhoto[];
	viewMode?: ViewMode;
	onSelectPhoto: (photo: LocalPhoto) => void;
	onOpenCamera?: () => void;
	onTriggerImport?: () => void;
	emptyTitle?: string;
	emptyDescription?: string;
	showEmptyActions?: boolean;
}

function getGroupLabel(isoDate: string, viewMode: Exclude<ViewMode, 'all'>): string {
	const parsed = new Date(isoDate);
	if (Number.isNaN(parsed.getTime())) return 'Unknown Date';
	if (viewMode === 'years') {
		return String(parsed.getFullYear());
	}
	if (viewMode === 'months') {
		return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
	return parsed.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function PhotoTile({
	photo,
	onSelectPhoto,
}: {
	photo: LocalPhoto;
	onSelectPhoto: (photo: LocalPhoto) => void;
}) {
	return (
		<button
			type="button"
			aria-label={`Open photo from ${formatPhotoDate(photo.date)}`}
			className="aspect-square relative cursor-pointer overflow-hidden group rounded-sm md:rounded-lg bg-gray-200/70 dark:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue active:scale-[0.98] transition-transform"
			onClick={() => onSelectPhoto(photo)}
		>
			<Image
				src={photo.url}
				alt={photo.title || `Photo from ${formatPhotoDate(photo.date)}`}
				fill
				className="object-cover transition-transform duration-300 group-hover:scale-105"
				unoptimized
			/>
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
			{photo.isFavorite && (
				<span
					aria-label="Favorited"
					className="absolute bottom-1.5 right-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]"
				>
					<Heart aria-hidden="true" className="w-3.5 h-3.5 text-white fill-white" />
				</span>
			)}
		</button>
	);
}

export default function PhotoGrid({
	photos,
	viewMode = 'all',
	onSelectPhoto,
	onOpenCamera,
	onTriggerImport,
	emptyTitle = 'No Photos',
	emptyDescription = 'Photos taken with Camera or imported from your device will appear here.',
	showEmptyActions = true,
}: PhotoGridProps) {
	const groupedPhotos = useMemo(() => {
		if (viewMode === 'all') return null;
		const groups = new Map<string, LocalPhoto[]>();
		for (const photo of photos) {
			const label = getGroupLabel(photo.date, viewMode);
			const existing = groups.get(label);
			if (existing) {
				existing.push(photo);
			} else {
				groups.set(label, [photo]);
			}
		}
		return Array.from(groups.entries());
	}, [photos, viewMode]);

	if (photos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[280px] h-[60%] px-6 text-center">
				<div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-4">
					<ImageIcon aria-hidden="true" className="w-8 h-8 text-gray-400 dark:text-gray-500" />
				</div>
				<h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{emptyTitle}</h2>
				<p className="text-xs text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed">
					{emptyDescription}
				</p>
				{showEmptyActions && (onOpenCamera || onTriggerImport) && (
					<div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
						{onOpenCamera && (
							<button
								type="button"
								onClick={onOpenCamera}
								className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ios-blue text-white text-xs font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
							>
								<Camera aria-hidden="true" className="w-3.5 h-3.5" />
								<span>Open Camera</span>
							</button>
						)}
						{onTriggerImport && (
							<button
								type="button"
								onClick={onTriggerImport}
								className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-100 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/15 active:scale-[0.98] transition-all"
							>
								<Upload aria-hidden="true" className="w-3.5 h-3.5" />
								<span>Import Photos</span>
							</button>
						)}
					</div>
				)}
			</div>
		);
	}

	if (groupedPhotos) {
		return (
			<div className="space-y-5 p-2 md:p-4">
				{groupedPhotos.map(([label, items]) => (
					<section key={label}>
						<div className="flex items-baseline justify-between px-1 mb-2">
							<h2 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h2>
							<span className="text-[11px] text-gray-500 dark:text-gray-400">
								{items.length} {items.length === 1 ? 'Photo' : 'Photos'}
							</span>
						</div>
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-3">
							{items.map(photo => (
								<PhotoTile key={photo.id} photo={photo} onSelectPhoto={onSelectPhoto} />
							))}
						</div>
					</section>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-3 p-1 md:p-4">
			{photos.map(photo => (
				<PhotoTile key={photo.id} photo={photo} onSelectPhoto={onSelectPhoto} />
			))}
		</div>
	);
}
