'use client';

import Image from 'next/image';

interface PhotoGridProps {
	photos: string[];
	onSelectPhoto: (url: string) => void;
}

export default function PhotoGrid({ photos, onSelectPhoto }: PhotoGridProps) {
	if (photos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-400">
				<p className="text-sm font-medium">No Photos Found</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-3 p-1 md:p-4">
			{photos.map((img, i) => (
				<div
					key={i}
					className="aspect-square relative cursor-pointer overflow-hidden group rounded-sm md:rounded-lg bg-gray-100 dark:bg-white/5"
					onClick={() => onSelectPhoto(img)}
				>
					<Image
						src={img}
						alt={`Photo ${i + 1}`}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						unoptimized
					/>
					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
				</div>
			))}
		</div>
	);
}
