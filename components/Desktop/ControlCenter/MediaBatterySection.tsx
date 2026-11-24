'use client';

import { Pause, Play, SkipBack, SkipForward, Zap } from 'lucide-react';
import Image from 'next/image';

interface MediaBatterySectionProps {
	isPlaying: boolean;
	onTogglePlay: () => void;
	trackTitle: string;
	trackArtist: string;
	batteryLevel: number | null;
	batteryCharging: boolean;
}

export default function MediaBatterySection({
	isPlaying,
	onTogglePlay,
	trackTitle,
	trackArtist,
	batteryLevel,
	batteryCharging,
}: MediaBatterySectionProps) {
	return (
		<div className="space-y-2">
			{/* Music Player Widget - Compact */}
			<div className="p-2.5 rounded-xl bg-white/10">
				<div className="flex items-center gap-2 mb-2">
					{/* Album Art - Smaller */}
					<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-400 to-purple-500 shrink-0 overflow-hidden relative">
						<Image
							src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=64&h=64&fit=crop"
							alt="Album art"
							width={40}
							height={40}
							className="object-cover rounded-lg"
							unoptimized
						/>
					</div>
					{/* Track Info - Compact */}
					<div className="flex-1 min-w-0">
						<div className="text-xs font-semibold text-white truncate">{trackTitle}</div>
						<div className="text-[10px] text-white/70 truncate">{trackArtist}</div>
					</div>
				</div>
				{/* Playback Controls - Compact */}
				<div className="flex items-center justify-center gap-2">
					<button
						className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
						aria-label="Previous track"
					>
						<SkipBack aria-hidden="true" size={10} className="text-white" />
					</button>
					<button
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
						onClick={onTogglePlay}
						aria-label={isPlaying ? 'Pause' : 'Play'}
					>
						{isPlaying ? (
							<Pause aria-hidden="true" size={10} className="text-white" />
						) : (
							<Play aria-hidden="true" size={10} className="text-white" />
						)}
					</button>
					<button
						className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
						aria-label="Next track"
					>
						<SkipForward aria-hidden="true" size={10} className="text-white" />
					</button>
				</div>
			</div>

			{/* Battery Indicator - Compact */}
			<div className="p-2.5 rounded-xl bg-white/10">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-white">Battery</span>
					<div className="flex items-center gap-2">
						{batteryCharging ? (
							<Zap aria-hidden="true" size={14} className="text-white" />
						) : (
							<div className="relative flex items-center">
								<div className="w-8 h-4 border border-white/70 rounded-[2px] relative overflow-hidden">
									<div
										className="absolute left-0.5 top-0.5 bottom-0.5 rounded-[1px] bg-white transition-all"
										style={{ width: `${batteryLevel || 0}%` }}
									></div>
								</div>
								<div className="ml-0.5 w-0.5 h-2 bg-white/70 rounded-r-[1px]"></div>
							</div>
						)}
						<span className="text-xs font-medium text-white">{batteryLevel}%</span>
					</div>
				</div>
			</div>
		</div>
	);
}
