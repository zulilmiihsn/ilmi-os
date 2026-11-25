'use client';

import Image from 'next/image';
import { Music as MusicIcon } from 'lucide-react';
import type { DemoTrack } from './library';

export function TrackArt({ track, className }: { track: DemoTrack; className?: string }) {
	const sizeClass = className ?? 'w-12 h-12';
	return (
		<span
			aria-hidden="true"
			className={`relative overflow-hidden flex items-center justify-center rounded-md text-white shrink-0 ${sizeClass}`}
			style={{ background: `linear-gradient(135deg, ${track.hue[0]}, ${track.hue[1]})` }}
		>
			{track.artworkUrl ? (
				<Image
					src={track.artworkUrl}
					alt=""
					fill
					sizes="96px"
					unoptimized
					className="object-cover"
				/>
			) : (
				<MusicIcon size={20} />
			)}
		</span>
	);
}
