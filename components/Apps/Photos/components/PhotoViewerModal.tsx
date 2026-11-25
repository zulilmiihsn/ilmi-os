'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Download, Heart, Trash2, X } from 'lucide-react';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../../utils/hooks/useFocusTrap';
import { triggerHaptic } from '../../../../utils/haptic';
import { formatPhotoDateTime } from '../photoHelpers';
import type { LocalPhoto } from '../types';

interface PhotoViewerModalProps {
	photo: LocalPhoto | null;
	onClose: () => void;
	onToggleFavorite: (id: string) => void;
	onDelete: (id: string) => void;
	onPrev: () => void;
	onNext: () => void;
	hasPrev: boolean;
	hasNext: boolean;
}

export default function PhotoViewerModal({
	photo,
	onClose,
	onToggleFavorite,
	onDelete,
	onPrev,
	onNext,
	hasPrev,
	hasNext,
}: PhotoViewerModalProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const touchStartXRef = useRef<number | null>(null);
	// Mounted only while open: restores focus on close/unmount.
	useRestoreFocus(Boolean(photo), rootRef);
	useFocusTrap(Boolean(photo), rootRef);

	if (!photo) return null;

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = photo.url;
		link.download = photo.title || `${photo.id}.jpg`;
		link.click();
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (!touch) return;
		touchStartXRef.current = touch.clientX;
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		const startX = touchStartXRef.current;
		touchStartXRef.current = null;
		const touch = e.changedTouches[0];
		if (startX === null || !touch) return;
		const deltaX = touch.clientX - startX;
		if (deltaX <= -40 && hasNext) {
			triggerHaptic('light');
			onNext();
		} else if (deltaX >= 40 && hasPrev) {
			triggerHaptic('light');
			onPrev();
		}
	};

	return (
		<div
			ref={rootRef}
			role="dialog"
			aria-modal="true"
			aria-label="Photo preview"
			onKeyDown={e => {
				if (e.key === 'Escape') {
					e.stopPropagation();
					onClose();
				} else if (e.key === 'ArrowLeft' && hasPrev) {
					onPrev();
				} else if (e.key === 'ArrowRight' && hasNext) {
					onNext();
				}
			}}
			className="absolute inset-0 z-50 flex flex-col bg-[#0d0d0f]/95 backdrop-blur-xl text-white"
			onClick={onClose}
		>
			{/* Top Bar */}
			<div
				className="flex items-center justify-between px-4 pt-3 md:pt-5 pb-3 bg-gradient-to-b from-black/60 to-transparent z-10"
				onClick={e => e.stopPropagation()}
			>
				<div className="min-w-0">
					<p className="text-sm font-semibold truncate">{formatPhotoDateTime(photo.date)}</p>
					<p className="text-[11px] text-white/60">
						{photo.source === 'import' ? photo.title || 'Imported Photo' : 'Camera'}
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-white/85 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
					aria-label="Close photo preview"
				>
					<X aria-hidden="true" className="w-5 h-5" />
				</button>
			</div>

			{/* Main Image Canvas */}
			<div
				className="flex-1 relative flex items-center justify-center px-10 md:px-14 min-h-0"
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
			>
				{hasPrev && (
					<button
						type="button"
						onClick={e => {
							e.stopPropagation();
							triggerHaptic('light');
							onPrev();
						}}
						aria-label="Previous photo"
						className="flex absolute left-2 sm:left-3 z-10 p-1.5 sm:p-2 rounded-full bg-white/15 hover:bg-white/25 text-white/90 active:scale-95 transition-all"
					>
						<ChevronLeft aria-hidden="true" className="w-5 h-5" />
					</button>
				)}

				<div
					className="relative w-full h-full max-w-4xl max-h-[72vh]"
					onClick={e => e.stopPropagation()}
				>
					<Image
						src={photo.url}
						alt={photo.title || 'Photo preview'}
						fill
						className="object-contain rounded-lg"
						unoptimized
						priority
					/>
				</div>

				{hasNext && (
					<button
						type="button"
						onClick={e => {
							e.stopPropagation();
							triggerHaptic('light');
							onNext();
						}}
						aria-label="Next photo"
						className="flex absolute right-2 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full bg-white/15 hover:bg-white/25 text-white/90 active:scale-95 transition-all"
					>
						<ChevronRight aria-hidden="true" className="w-5 h-5" />
					</button>
				)}
			</div>

			{/* Bottom iOS/macOS Photos Action Pill */}
			<div
				className="pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 flex justify-center z-10"
				onClick={e => e.stopPropagation()}
			>
				<div className="inline-flex items-center gap-6 px-6 py-2.5 rounded-full bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/15 shadow-lg">
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							onToggleFavorite(photo.id);
						}}
						aria-label={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
						aria-pressed={Boolean(photo.isFavorite)}
						className="p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all"
					>
						<Heart
							aria-hidden="true"
							className={`w-5 h-5 transition-colors ${
								photo.isFavorite ? 'text-ios-red fill-ios-red' : 'text-white/90'
							}`}
						/>
					</button>

					<button
						type="button"
						onClick={handleDownload}
						aria-label="Download photo"
						className="p-1.5 rounded-full hover:bg-white/10 text-white/90 active:scale-90 transition-all"
					>
						<Download aria-hidden="true" className="w-5 h-5" />
					</button>

					<button
						type="button"
						onClick={() => {
							triggerHaptic('medium');
							onDelete(photo.id);
						}}
						aria-label="Delete photo"
						className="p-1.5 rounded-full hover:bg-white/10 text-ios-red active:scale-90 transition-all"
					>
						<Trash2 aria-hidden="true" className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
