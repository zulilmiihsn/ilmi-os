'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
	ChevronDown,
	Heart,
	Music as MusicIcon,
	Pause,
	Play,
	Repeat,
	Repeat1,
	Shuffle,
	SkipBack,
	SkipForward,
	Volume1,
	Volume2,
} from 'lucide-react';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
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
	const modalRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(true, modalRef);
	useFocusTrap(true, modalRef);

	return (
		<div
			ref={modalRef}
			role="dialog"
			aria-modal="true"
			aria-label={`Now playing: ${current.title}`}
			onKeyDown={e => {
				if (e.key === 'Escape') onClose();
			}}
			className="absolute inset-0 z-50 flex flex-col overflow-hidden text-white bg-[#121216]"
		>
			{/* Dynamic blurred artwork / gradient mesh backdrop */}
			<div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
				{current.artworkUrl ? (
					<Image
						src={current.artworkUrl}
						alt=""
						fill
						sizes="400px"
						unoptimized
						className="object-cover scale-125 blur-3xl opacity-65"
					/>
				) : (
					<div
						className="w-full h-full scale-110 blur-2xl opacity-85"
						style={{
							background: `radial-gradient(circle at 25% 20%, ${current.hue[0]} 0%, transparent 60%), radial-gradient(circle at 80% 75%, ${current.hue[1]} 0%, #111115 70%)`,
						}}
					/>
				)}
				<div className="absolute inset-0 bg-black/45 backdrop-blur-xl" />
			</div>

			{/* Top drag pill */}
			<div
				aria-hidden="true"
				className="relative z-10 w-9 h-1 rounded-full bg-white/40 mx-auto mt-3 shrink-0"
			/>

			{/* Header */}
			<div className="relative z-10 pt-2 px-4 shrink-0 flex items-center justify-between">
				<button
					onClick={onClose}
					aria-label="Close player"
					autoFocus
					className="relative p-2 text-white/80 hover:text-white active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
				>
					<ChevronDown aria-hidden="true" size={22} />
				</button>
				<button
					onClick={() => onToggleLike(current.id)}
					aria-label={isLiked ? `Unlike ${current.title}` : `Like ${current.title}`}
					aria-pressed={isLiked}
					className="relative w-11 h-11 flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1 after:content-['']"
				>
					<Heart
						aria-hidden="true"
						size={20}
						className={isLiked ? 'text-[#fa2d48]' : 'text-white/70'}
						fill={isLiked ? 'currentColor' : 'none'}
					/>
				</button>
			</div>

			<div className="relative z-10 flex-1 overflow-y-auto px-8 pt-2 pb-[max(env(safe-area-inset-bottom),2rem)] flex flex-col max-w-md w-full mx-auto">
				<span
					aria-hidden="true"
					className={`relative overflow-hidden w-full max-w-[210px] mx-auto shrink-0 aspect-square rounded-2xl text-white flex items-center justify-center shadow-2xl transition-transform duration-500 ${
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
				<p className="text-xl font-semibold tracking-tight mt-5 truncate shrink-0">
					{current.title}
				</p>
				<p className="text-base text-white/75 truncate shrink-0">
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
						className="w-full accent-[#fa2d48]"
					/>
					<div className="flex justify-between text-xs text-white/70 tabular-nums mt-1">
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
					<Volume1 aria-hidden="true" size={14} className="text-white/70 shrink-0" />
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={volume}
						onChange={e => onChangeVolume(Number(e.target.value))}
						aria-label="Volume"
						className="flex-1 accent-[#fa2d48]"
					/>
					<Volume2 aria-hidden="true" size={16} className="text-white/70 shrink-0" />
				</div>

				<div className="flex items-center justify-between mt-5 px-6">
					<button
						onClick={onToggleShuffle}
						aria-label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
						aria-pressed={shuffle}
						className={`w-11 h-11 rounded-xl flex items-center justify-center active:opacity-50 transition-all ${
							shuffle ? 'text-[#fa2d48] bg-white/15' : 'text-white/65'
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
						className={`w-11 h-11 rounded-xl flex items-center justify-center active:opacity-50 transition-all ${
							repeat !== 'off' ? 'text-[#fa2d48] bg-white/15' : 'text-white/65'
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
