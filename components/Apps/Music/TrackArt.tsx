'use client';

import { Music as MusicIcon } from 'lucide-react';
import type { DemoTrack } from './library';

export function TrackArt({ track, className }: { track: DemoTrack; className?: string }) {
	return (
		<span
			aria-hidden="true"
			className={`flex items-center justify-center rounded-md text-white shrink-0 ${className ?? 'w-12 h-12'}`}
			style={{ background: `linear-gradient(135deg, ${track.hue[0]}, ${track.hue[1]})` }}
		>
			<MusicIcon size={20} />
		</span>
	);
}
