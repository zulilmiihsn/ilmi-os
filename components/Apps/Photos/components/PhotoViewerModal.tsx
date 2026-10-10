'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useRestoreFocus } from '../../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../../utils/hooks/useFocusTrap';

interface PhotoViewerModalProps {
	imageUrl: string | null;
	onClose: () => void;
}

export default function PhotoViewerModal({ imageUrl, onClose }: PhotoViewerModalProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	// Mounted only while open: restores focus on close/unmount.
	useRestoreFocus(!!imageUrl, rootRef);
	useFocusTrap(!!imageUrl, rootRef);

	if (!imageUrl) return null;

	return (
		<div
			ref={rootRef}
			onKeyDown={e => {
				if (e.key === 'Escape') onClose();
			}}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
			onClick={onClose}
		>
			<button
				onClick={onClose}
				className="absolute top-12 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
				aria-label="Close photo preview"
			>
				<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div
				className="relative max-w-4xl max-h-[85vh] w-[90vw] h-[80vh]"
				onClick={e => e.stopPropagation()}
			>
				<Image
					src={imageUrl}
					alt="Preview"
					fill
					className="object-contain rounded-lg"
					unoptimized
					priority
				/>
			</div>
		</div>
	);
}
