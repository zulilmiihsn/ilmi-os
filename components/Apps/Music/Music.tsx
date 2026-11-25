'use client';

import { useState } from 'react';
import { Music as MusicIcon, Pause, Play, Search, SkipForward } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import { TrackArt } from './TrackArt';
import { LibraryTab, SearchTab } from './MusicTabs';
import NowPlayingModal from './NowPlayingModal';
import { useMusicPlayer } from './useMusicPlayer';

type Tab = 'library' | 'search';

export default function Music() {
	const { darkMode } = useSettingsStore();
	const [tab, setTab] = useState<Tab>('library');
	const player = useMusicPlayer();

	const rowCard = darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5';

	return (
		<div
			className={`music-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			{player.persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save likes. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			{tab === 'library' && (
				<LibraryTab
					tracks={player.libraryTracks}
					rowCard={rowCard}
					liked={player.liked}
					currentTrackId={player.current?.id ?? null}
					isPlaying={player.isPlaying}
					onPlayTrack={player.playTrackId}
					onToggleLike={player.toggleLike}
					onImportFiles={player.importLocalFiles}
				/>
			)}

			{tab === 'search' && (
				<SearchTab
					rowCard={rowCard}
					searchQuery={player.searchQuery}
					results={player.results}
					catalogTracks={player.catalogTracks}
					catalogLoading={player.catalogLoading}
					catalogError={player.catalogError}
					currentTrackId={player.current?.id ?? null}
					isPlaying={player.isPlaying}
					onSearchChange={player.setSearchQuery}
					onSearchAppleMusic={player.searchAppleMusic}
					onPlayTrack={player.playTrackId}
				/>
			)}

			{/* MiniPlayer */}
			{player.current && (
				<div className="shrink-0 mx-3 mb-2 rounded-2xl backdrop-blur-2xl border shadow-lg bg-white/85 dark:bg-[#1c1c1e]/85 border-black/5 dark:border-white/15 flex items-center gap-1 pl-2 pr-1 py-1.5">
					<button
						onClick={() => {
							triggerHaptic('light');
							player.setFullPlayer(true);
						}}
						aria-label={`Open now playing: ${player.current.title}`}
						className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-60 transition-opacity py-0.5"
					>
						<TrackArt track={player.current} className="w-11 h-11" />
						<span className="flex-1 min-w-0">
							<span className="block text-sm font-medium truncate">{player.current.title}</span>
							<span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
								{player.current.artist}
							</span>
						</span>
					</button>
					<button
						onClick={player.togglePlay}
						aria-label={player.isPlaying ? 'Pause' : 'Play'}
						className="w-11 h-11 flex items-center justify-center shrink-0 active:opacity-50 transition-opacity"
					>
						{player.isPlaying ? (
							<Pause aria-hidden="true" size={22} className="fill-current" />
						) : (
							<Play aria-hidden="true" size={22} className="fill-current" />
						)}
					</button>
					<button
						onClick={player.playNext}
						aria-label="Next track"
						className="w-11 h-11 flex items-center justify-center shrink-0 active:opacity-50 transition-opacity"
					>
						<SkipForward aria-hidden="true" size={22} className="fill-current" />
					</button>
				</div>
			)}

			{/* Floating Liquid Glass pill tab bar */}
			<div className="shrink-0 px-4 pt-1 pb-[max(env(safe-area-inset-bottom),1.75rem)] flex items-center justify-center">
				<div
					role="tablist"
					aria-label="Music sections"
					className="w-full max-w-[260px] rounded-full backdrop-blur-2xl border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] bg-white/85 dark:bg-[#1c1c1e]/85 border-black/5 dark:border-white/15 px-2 py-1.5"
				>
					<div className="flex items-center justify-around gap-1">
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
								className={`relative flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 ${
									tab === id ? 'text-[#fa2d48] bg-[#fa2d48]/10' : 'text-gray-500 dark:text-gray-400'
								}`}
							>
								<Icon aria-hidden="true" size={20} className="mb-0.5" />
								<span className="text-[10px] font-semibold tracking-tight">{label}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Now Playing */}
			{player.current && player.fullPlayer && (
				<NowPlayingModal
					current={player.current}
					isPlaying={player.isPlaying}
					isLiked={player.liked.includes(player.current.id)}
					position={player.position}
					duration={player.duration}
					volume={player.volume}
					shuffle={player.shuffle}
					repeat={player.repeat}
					onClose={() => player.setFullPlayer(false)}
					onToggleLike={player.toggleLike}
					onSeek={player.seek}
					onPrev={player.playPrev}
					onTogglePlay={player.togglePlay}
					onNext={player.playNext}
					onChangeVolume={player.changeVolume}
					onToggleShuffle={player.toggleShuffle}
					onCycleRepeat={player.cycleRepeat}
				/>
			)}
		</div>
	);
}
