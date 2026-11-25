'use client';

import Image from 'next/image';
import {
	ChevronDown,
	Music as MusicIcon,
	Pause,
	Play,
	Repeat,
	Repeat1,
	Shuffle,
	SkipBack,
	SkipForward,
	Star,
	Volume1,
	Volume2,
} from 'lucide-react';
import { formatPlayerTime, type DemoTrack, type RepeatMode } from './library';

interface NowPlayingModalProps {
	current: DemoTrack;
	isPlaying: boolean;
	isLiked: boolean;
	position: number;
	duration: number;
	volume: number;
	shuffle: boolean;
	repeat: RepeatMode;
	onClose: () => void;
	onToggleLike: (id: string) => void;
	onSeek: (value: number) => void;
	onPrev: () => void;
	onTogglePlay: () => void;
	onNext: () => void;
	onChangeVolume: (value: number) => void;
	onToggleShuffle: () => void;
	onCycleRepeat: () => void;
}

export default function NowPlayingModal({
	current,
	isPlaying,
	isLiked,
	position,
	duration,
	volume,
	shuffle,
	repeat,
	onClose,
	onToggleLike,
	onSeek,
	onPrev,
	onTogglePlay,
	onNext,
	onChangeVolume,
	onToggleShuffle,
	onCycleRepeat,
}: NowPlayingModalProps) {
	return (
		<div className="absolute inset-0 z-50 flex flex-col bg-[#f2f2f7] dark:bg-black text-black dark:text-white">
			<div className="pt-10 px-4 shrink-0 flex items-center justify-between">
				<button
					onClick={onClose}
					aria-label="Close player"
					className="relative p-2 active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronDown aria-hidden="true" size={22} className="text-gray-500" />
				</button>
				<button
					onClick={() => onToggleLike(current.id)}
					aria-label={isLiked ? `Unlike ${current.title}` : `Like ${current.title}`}
					aria-pressed={isLiked}
					className="relative w-11 h-11 flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1 after:content-['']"
				>
					<Star
						aria-hidden="true"
						size={20}
						className={isLiked ? 'text-ios-yellow' : 'text-gray-400'}
						fill={isLiked ? 'currentColor' : 'none'}
					/>
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col">
				<span
					aria-hidden="true"
					className={`relative overflow-hidden w-full max-w-[200px] mx-auto shrink-0 aspect-square rounded-2xl text-white flex items-center justify-center shadow-2xl transition-transform duration-500 ${
						isPlaying ? '' : 'scale-95'
					}`}
					style={{ background: `linear-gradient(135deg, ${current.hue[0]}, ${current.hue[1]})` }}
				>
					{current.artworkUrl ? (
						<Image
							src={current.artworkUrl}
							alt=""
							fill
							sizes="220px"
							unoptimized
							className="object-cover"
						/>
					) : (
						<MusicIcon size={64} strokeWidth={1.5} />
					)}
				</span>
				<p className="text-xl font-semibold tracking-tight mt-4 truncate shrink-0">
					{current.title}
				</p>
				<p className="text-base text-gray-500 dark:text-gray-400 truncate shrink-0">
					{current.artist} — {current.album ?? 'Demo Mix'}
				</p>

				<div className="mt-4">
					<input
						type="range"
						min={0}
						max={Math.max(1, duration)}
						step={0.1}
						value={Math.min(position, Math.max(1, duration))}
						onChange={e => onSeek(Number(e.target.value))}
						aria-label="Seek"
						className="w-full accent-gray-300 dark:accent-white"
					/>
					<div className="flex justify-between text-xs text-gray-400 tabular-nums mt-1">
						<span>{formatPlayerTime(position)}</span>
						<span>-{formatPlayerTime(Math.max(0, duration - position))}</span>
					</div>
				</div>

				<div className="flex items-center justify-between mt-2 px-2">
					<button
						onClick={onPrev}
						aria-label="Previous track"
						className="w-14 h-14 flex items-center justify-center active:opacity-50 transition-opacity"
					>
						<SkipBack aria-hidden="true" size={36} className="fill-current" />
					</button>
					<button
						onClick={onTogglePlay}
						aria-label={isPlaying ? 'Pause' : 'Play'}
						className="w-14 h-14 flex items-center justify-center active:opacity-50 transition-opacity"
					>
						{isPlaying ? (
							<Pause aria-hidden="true" size={44} className="fill-current" />
						) : (
							<Play aria-hidden="true" size={44} className="fill-current" />
						)}
					</button>
					<button
						onClick={onNext}
						aria-label="Next track"
						className="w-14 h-14 flex items-center justify-center active:opacity-50 transition-opacity"
					>
						<SkipForward aria-hidden="true" size={36} className="fill-current" />
					</button>
				</div>

				<div className="flex items-center gap-3 mt-4">
					<Volume1 aria-hidden="true" size={14} className="text-gray-400 shrink-0" />
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={volume}
						onChange={e => onChangeVolume(Number(e.target.value))}
						aria-label="Volume"
						className="flex-1 accent-gray-300 dark:accent-white"
					/>
					<Volume2 aria-hidden="true" size={16} className="text-gray-400 shrink-0" />
				</div>

				<div className="flex items-center justify-between mt-5 px-6">
					<button
						onClick={onToggleShuffle}
						aria-label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
						aria-pressed={shuffle}
						className={`w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity ${
							shuffle ? 'text-ios-blue' : 'text-gray-400'
						}`}
					>
						<Shuffle aria-hidden="true" size={20} />
					</button>
					<button
						onClick={onCycleRepeat}
						aria-label={
							repeat === 'one' ? 'Repeat one on' : repeat === 'all' ? 'Repeat all on' : 'Repeat off'
						}
						aria-pressed={repeat !== 'off'}
						className={`w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity ${
							repeat !== 'off' ? 'text-ios-blue' : 'text-gray-400'
						}`}
					>
						{repeat === 'one' ? (
							<Repeat1 aria-hidden="true" size={20} />
						) : (
							<Repeat aria-hidden="true" size={20} />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
