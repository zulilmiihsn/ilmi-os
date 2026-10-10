'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
	ChevronDown,
	Music as MusicIcon,
	Pause,
	Play,
	Repeat,
	Repeat1,
	Search,
	Shuffle,
	SkipBack,
	SkipForward,
	Star,
	Volume1,
	Volume2,
	X,
} from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	DEMO_TRACKS,
	buildQueue,
	formatPlayerTime,
	loadLiked,
	nextIndex,
	prevIndex,
	saveLiked,
	toggleLiked,
	type DemoTrack,
	type RepeatMode,
} from './library';
import { getEnginePosition, playTrack, setEngineVolume, stopPlayback } from './audioEngine';

type Tab = 'library' | 'search';

function TrackArt({ track, className }: { track: DemoTrack; className?: string }) {
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

export default function Music() {
	const { darkMode } = useSettingsStore();
	const [tab, setTab] = useState<Tab>('library');
	const [queue, setQueue] = useState<string[]>([]);
	const [qi, setQi] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [shuffle, setShuffle] = useState(false);
	const [repeat, setRepeat] = useState<RepeatMode>('off');
	const [volume, setVolume] = useState(0.8);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [liked, setLiked] = useState<string[]>([]);
	const [fullPlayer, setFullPlayer] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [persistError, setPersistError] = useState(false);

	const playToken = useRef(0);
	const lastRepeatTap = useRef(0);
	const stateRef = useRef({ queue, qi, repeat });
	stateRef.current = { queue, qi, repeat };
	const advanceRef = useRef(() => {});
	advanceRef.current = () => {
		const s = stateRef.current;
		const next = nextIndex(s.queue, s.qi, s.repeat);
		if (next === null) {
			stopPlayback();
			setIsPlaying(false);
			setPosition(0);
		} else {
			void playAt(next);
		}
	};

	useEffect(() => {
		setLiked(loadLiked());
		return () => stopPlayback();
	}, []);

	useEffect(() => {
		if (!isPlaying) return;
		const timer = setInterval(() => setPosition(getEnginePosition()), 500);
		return () => clearInterval(timer);
	}, [isPlaying]);

	const playAt = async (index: number, list?: string[], offset = 0) => {
		const q = list ?? stateRef.current.queue;
		const track = DEMO_TRACKS.find(t => t.id === q[index]);
		if (!track) return;
		const token = ++playToken.current;
		const realDuration = await playTrack(track, offset, () => advanceRef.current());
		if (token !== playToken.current) return;
		setQueue(q);
		setQi(index);
		setDuration(realDuration);
		setPosition(offset);
		setIsPlaying(true);
	};

	const togglePlay = () => {
		if (queue.length === 0) return;
		triggerHaptic('light');
		if (isPlaying) {
			setPosition(getEnginePosition());
			stopPlayback();
			playToken.current++;
			setIsPlaying(false);
		} else {
			void playAt(qi, queue, position);
		}
	};

	const playNext = () => {
		triggerHaptic('light');
		const next = nextIndex(queue, qi, repeat);
		if (next === null) {
			stopPlayback();
			setIsPlaying(false);
			setPosition(0);
		} else {
			void playAt(next);
		}
	};

	const playPrev = () => {
		triggerHaptic('light');
		const prev = prevIndex(queue, qi, position, repeat);
		if (prev === 'restart') void playAt(qi, queue, 0);
		else void playAt(prev);
	};

	const playTrackId = (id: string) => {
		triggerHaptic('light');
		const q = buildQueue(DEMO_TRACKS, id, shuffle);
		void playAt(0, q, 0);
	};

	const toggleShuffle = () => {
		triggerHaptic('light');
		const on = !shuffle;
		setShuffle(on);
		if (queue.length > 0) {
			const currentId = queue[qi] ?? queue[0] ?? '';
			const q = buildQueue(DEMO_TRACKS, currentId, on);
			setQueue(q);
			setQi(0);
		}
	};

	const cycleRepeat = () => {
		triggerHaptic('light');
		const now = Date.now();
		if (now - lastRepeatTap.current < 350) {
			setRepeat('one');
		} else {
			setRepeat(prev => (prev === 'off' ? 'all' : 'off'));
		}
		lastRepeatTap.current = now;
	};

	const toggleLike = (id: string) => {
		triggerHaptic('light');
		const next = toggleLiked(liked, id);
		setLiked(next);
		if (!saveLiked(next)) setPersistError(true);
	};

	const seek = (value: number) => {
		setPosition(value);
		if (isPlaying) void playAt(qi, queue, value);
	};

	const changeVolume = (value: number) => {
		setVolume(value);
		setEngineVolume(value);
	};

	const currentId = queue[qi] ?? null;
	const current = DEMO_TRACKS.find(t => t.id === currentId) ?? null;
	const results = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return DEMO_TRACKS;
		return DEMO_TRACKS.filter(
			t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
		);
	}, [searchQuery]);

	const rowCard = darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5';

	return (
		<div
			className={`music-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save likes. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			{tab === 'library' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Library</h1>
					</div>
					<div className="flex-1 overflow-y-auto pb-4">
						<div
							className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}
						>
							{DEMO_TRACKS.map((t, i) => (
								<div
									key={t.id}
									className={`flex items-center gap-3 pl-3 pr-2 py-2 ${
										i < DEMO_TRACKS.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
									}`}
								>
									<button
										onClick={() => playTrackId(t.id)}
										aria-label={`Play ${t.title} by ${t.artist}`}
										className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-60 transition-opacity py-1"
									>
										<TrackArt track={t} />
										<span className="min-w-0">
											<span className="block text-base font-normal truncate">{t.title}</span>
											<span className="block text-xs text-gray-400 truncate">
												{t.artist} · {formatPlayerTime(t.durationSec)}
											</span>
										</span>
									</button>
									<button
										onClick={() => toggleLike(t.id)}
										aria-label={liked.includes(t.id) ? `Unlike ${t.title}` : `Like ${t.title}`}
										aria-pressed={liked.includes(t.id)}
										className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform shrink-0"
									>
										<Star
											aria-hidden="true"
											size={18}
											className={liked.includes(t.id) ? 'text-ios-yellow' : 'text-gray-400'}
											fill={liked.includes(t.id) ? 'currentColor' : 'none'}
										/>
									</button>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{tab === 'search' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Search</h1>
					</div>
					<div className="px-4 pb-3 shrink-0">
						<div className="flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
							<input
								type="text"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder="Songs and artists"
								aria-label="Search songs"
								className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400 min-w-0"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									aria-label="Clear search"
									className="text-gray-400 ml-2"
								>
									<X aria-hidden="true" size={14} />
								</button>
							)}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto pb-4">
						{results.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
								<p className="text-lg font-semibold mb-1">No Results</p>
								<p className="text-sm">Nothing matches “{searchQuery.trim()}”.</p>
							</div>
						) : (
							<div className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}>
								{results.map((t, i) => (
									<button
										key={t.id}
										onClick={() => playTrackId(t.id)}
										aria-label={`Play ${t.title} by ${t.artist}`}
										className={`w-full flex items-center gap-3 px-3 py-2 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
											i < results.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
										}`}
									>
										<TrackArt track={t} />
										<span className="min-w-0">
											<span className="block text-base font-normal truncate">{t.title}</span>
											<span className="block text-xs text-gray-400 truncate">{t.artist}</span>
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</>
			)}

			{/* MiniPlayer */}
			{current && (
				<div className="shrink-0 mx-3 mb-2 rounded-2xl backdrop-blur-2xl border shadow-lg bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 flex items-center gap-1 pl-2 pr-1 py-1.5">
					<button
						onClick={() => {
							triggerHaptic('light');
							setFullPlayer(true);
						}}
						aria-label={`Open now playing: ${current.title}`}
						className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-60 transition-opacity py-0.5"
					>
						<TrackArt track={current} className="w-11 h-11" />
						<span className="flex-1 min-w-0">
							<span className="block text-sm font-medium truncate">{current.title}</span>
							<span className="block text-xs text-gray-400 truncate">{current.artist}</span>
						</span>
					</button>
					<button
						onClick={togglePlay}
						aria-label={isPlaying ? 'Pause' : 'Play'}
						className="w-11 h-11 flex items-center justify-center shrink-0 active:opacity-50 transition-opacity"
					>
						{isPlaying ? (
							<Pause aria-hidden="true" size={22} className="fill-current" />
						) : (
							<Play aria-hidden="true" size={22} className="fill-current" />
						)}
					</button>
					<button
						onClick={playNext}
						aria-label="Next track"
						className="w-11 h-11 flex items-center justify-center shrink-0 active:opacity-50 transition-opacity"
					>
						<SkipForward aria-hidden="true" size={22} className="fill-current" />
					</button>
				</div>
			)}

			{/* Bottom tabs */}
			<div
				role="tablist"
				aria-label="Music sections"
				className="shrink-0 border-t backdrop-blur-xl bg-white/80 dark:bg-black/80 border-black/5 dark:border-white/15 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
			>
				<div className="flex items-start justify-around">
					{(
						[
							{ id: 'library', label: 'Library', Icon: MusicIcon },
							{ id: 'search', label: 'Search', Icon: Search },
						] as const
					).map(({ id, label, Icon }) => (
						<button
							key={id}
							role="tab"
							aria-selected={tab === id}
							aria-label={label}
							onClick={() => {
								triggerHaptic('light');
								setTab(id);
							}}
							className={`relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 after:absolute after:-inset-2 after:content-[''] ${
								tab === id ? 'text-ios-red' : 'text-ios-gray'
							}`}
						>
							<Icon aria-hidden="true" size={24} className="mb-0.5" />
							<span className="text-[10px] font-medium tracking-tight">{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Now Playing */}
			{current && fullPlayer && (
				<div className="absolute inset-0 z-50 flex flex-col bg-[#f2f2f7] dark:bg-black text-black dark:text-white">
					<div className="pt-10 px-4 shrink-0 flex items-center justify-between">
						<button
							onClick={() => setFullPlayer(false)}
							aria-label="Close player"
							className="relative p-2 active:opacity-50 transition-opacity after:absolute after:-inset-2 after:content-['']"
						>
							<ChevronDown aria-hidden="true" size={22} className="text-gray-500" />
						</button>
						<button
							onClick={() => toggleLike(current.id)}
							aria-label={liked.includes(current.id) ? `Unlike ${current.title}` : `Like ${current.title}`}
							aria-pressed={liked.includes(current.id)}
							className="relative w-11 h-11 flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1 after:content-['']"
						>
							<Star
								aria-hidden="true"
								size={20}
								className={liked.includes(current.id) ? 'text-ios-yellow' : 'text-gray-400'}
								fill={liked.includes(current.id) ? 'currentColor' : 'none'}
							/>
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-8 flex flex-col justify-center">
						<span
							aria-hidden="true"
							className={`w-full aspect-square rounded-2xl text-white flex items-center justify-center shadow-2xl transition-transform duration-500 ${
								isPlaying ? '' : 'scale-95'
							}`}
							style={{ background: `linear-gradient(135deg, ${current.hue[0]}, ${current.hue[1]})` }}
						>
							<MusicIcon size={72} strokeWidth={1.5} />
						</span>
						<p className="text-xl font-semibold tracking-tight mt-6 truncate">{current.title}</p>
						<p className="text-base text-gray-500 dark:text-gray-400 truncate">
							{current.artist} — Demo Mix
						</p>

						<div className="mt-4">
							<input
								type="range"
								min={0}
								max={Math.max(1, duration)}
								step={0.1}
								value={Math.min(position, Math.max(1, duration))}
								onChange={e => seek(Number(e.target.value))}
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
								onClick={playPrev}
								aria-label="Previous track"
								className="w-14 h-14 flex items-center justify-center active:opacity-50 transition-opacity"
							>
								<SkipBack aria-hidden="true" size={36} className="fill-current" />
							</button>
							<button
								onClick={togglePlay}
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
								onClick={playNext}
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
								onChange={e => changeVolume(Number(e.target.value))}
								aria-label="Volume"
								className="flex-1 accent-gray-300 dark:accent-white"
							/>
							<Volume2 aria-hidden="true" size={16} className="text-gray-400 shrink-0" />
						</div>

						<div className="flex items-center justify-between mt-5 px-6">
							<button
								onClick={toggleShuffle}
								aria-label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
								aria-pressed={shuffle}
								className={`w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity ${
									shuffle ? 'text-ios-blue' : 'text-gray-400'
								}`}
							>
								<Shuffle aria-hidden="true" size={20} />
							</button>
							<button
								onClick={cycleRepeat}
								aria-label={
									repeat === 'one'
										? 'Repeat one on'
										: repeat === 'all'
											? 'Repeat all on'
											: 'Repeat off'
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
			)}
		</div>
	);
}
