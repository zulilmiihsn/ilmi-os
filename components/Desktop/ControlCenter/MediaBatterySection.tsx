'use client';

import { Music, Pause, Play, SkipBack, SkipForward, Zap } from 'lucide-react';

interface MediaBatterySectionProps {
	isPlaying: boolean;
	onTogglePlay: () => void;
	onPrevTrack: () => void;
	onNextTrack: () => void;
	trackTitle: string;
	trackArtist: string;
	batteryLevel: number | null;
	batteryCharging: boolean;
}

export default function MediaBatterySection({
	isPlaying,
	onTogglePlay,
	onPrevTrack,
	onNextTrack,
	trackTitle,
	trackArtist,
	batteryLevel,
	batteryCharging,
}: MediaBatterySectionProps) {
	const displayBattery = batteryLevel ?? 100;

	return (
		<div className="space-y-2">
			{/* Music Player Widget - Compact */}
			<div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
				<div className="flex items-center gap-2.5 mb-2">
					{/* Local Apple Music Artwork Primitive */}
					<div
						className="w-10 h-10 rounded-lg bg-linear-to-br from-[#fa2d48] to-[#c91c36] shrink-0 flex items-center justify-center shadow-inner ring-1 ring-white/15"
						aria-hidden="true"
					>
						<Music size={18} className="text-white/95" />
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
						type="button"
						className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
						onClick={onPrevTrack}
						aria-label="Previous track"
					>
						<SkipBack aria-hidden="true" size={12} className="text-white" />
					</button>
					<button
						type="button"
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
						onClick={onTogglePlay}
						aria-label={isPlaying ? 'Pause' : 'Play'}
					>
						{isPlaying ? (
							<Pause aria-hidden="true" size={12} className="text-white" />
						) : (
							<Play aria-hidden="true" size={12} className="text-white" />
						)}
					</button>
					<button
						type="button"
						className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all"
						onClick={onNextTrack}
						aria-label="Next track"
					>
						<SkipForward aria-hidden="true" size={12} className="text-white" />
					</button>
				</div>
			</div>

			{/* Battery Indicator - Compact */}
			<div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-white">Battery</span>
					<div className="flex items-center gap-2">
						{batteryCharging ? (
							<Zap aria-hidden="true" size={14} className="text-[#34c759]" />
						) : (
							<div className="relative flex items-center">
								<div className="w-8 h-4 border border-white/70 rounded-[2px] relative overflow-hidden">
									<div
										className="absolute left-0.5 top-0.5 bottom-0.5 rounded-[1px] bg-white transition-all"
										style={{ width: `${displayBattery}%` }}
									></div>
								</div>
								<div className="ml-0.5 w-0.5 h-2 bg-white/70 rounded-r-[1px]"></div>
							</div>
						)}
						<span className="text-xs font-medium text-white tabular-nums">{displayBattery}%</span>
					</div>
				</div>
			</div>
		</div>
	);
}
