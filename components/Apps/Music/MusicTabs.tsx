'use client';

import { useRef } from 'react';
import { AudioLines, Heart, LoaderCircle, Plus, Search as SearchIcon, X } from 'lucide-react';
import { formatPlayerTime, type DemoTrack } from './library';
import { TrackArt } from './TrackArt';

const FEATURED_ARTISTS = ['Tulus', 'Hindia', 'Coldplay', 'Billie Eilish', 'Daft Punk'];

interface LibraryTabProps {
	tracks: DemoTrack[];
	rowCard: string;
	liked: string[];
	currentTrackId: string | null;
	isPlaying: boolean;
	onPlayTrack: (id: string, pool?: DemoTrack[]) => void;
	onToggleLike: (id: string) => void;
	onImportFiles: (files: FileList | null) => void;
}

export function LibraryTab({
	tracks,
	rowCard,
	liked,
	currentTrackId,
	isPlaying,
	onPlayTrack,
	onToggleLike,
	onImportFiles,
}: LibraryTabProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<div className="pt-4 px-4 pb-2 shrink-0 flex items-end justify-between gap-3">
				<h1 className="text-ios-large-title">Library</h1>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					aria-label="Import local audio files"
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#fa2d48]/10 text-[#fa2d48] hover:bg-[#fa2d48]/20 active:scale-95 transition-all"
				>
					<Plus aria-hidden="true" size={14} />
					Import Audio
				</button>
				<input
					ref={fileInputRef}
					id="music-local-upload"
					name="music-local-upload"
					type="file"
					accept="audio/*,.mp3,.m4a,.wav,.ogg"
					multiple
					onChange={e => {
						onImportFiles(e.target.files);
						e.target.value = '';
					}}
					className="hidden"
				/>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				<div className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}>
					{tracks.map((t, i) => {
						const isCurrent = t.id === currentTrackId;
						const isFav = liked.includes(t.id);
						return (
							<div
								key={t.id}
								className={`flex items-center gap-3 pl-3 pr-2 py-2 ${
									i < tracks.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
								}`}
							>
								<button
									onClick={() => onPlayTrack(t.id, tracks)}
									aria-label={`Play ${t.title} by ${t.artist}`}
									className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-60 transition-opacity py-1"
								>
									<TrackArt track={t} />
									<span className="min-w-0 flex-1">
										<span
											className={`flex items-center gap-1.5 text-base truncate ${
												isCurrent ? 'text-[#fa2d48] font-medium' : 'font-normal'
											}`}
										>
											<span className="truncate">{t.title}</span>
											{isCurrent && (
												<AudioLines
													aria-hidden="true"
													size={14}
													className={`shrink-0 text-[#fa2d48] ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
												/>
											)}
										</span>
										<span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
											{t.artist} · {formatPlayerTime(t.durationSec)}
										</span>
									</span>
								</button>
								<button
									onClick={() => onToggleLike(t.id)}
									aria-label={isFav ? `Unlike ${t.title}` : `Like ${t.title}`}
									aria-pressed={isFav}
									className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform shrink-0"
								>
									<Heart
										aria-hidden="true"
										size={18}
										className={isFav ? 'text-[#fa2d48]' : 'text-gray-400'}
										fill={isFav ? 'currentColor' : 'none'}
									/>
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}

interface SearchTabProps {
	rowCard: string;
	searchQuery: string;
	results: DemoTrack[];
	catalogTracks: DemoTrack[];
	catalogLoading: boolean;
	catalogError: string | null;
	currentTrackId: string | null;
	isPlaying: boolean;
	onSearchChange: (value: string) => void;
	onSearchAppleMusic: (term: string) => void;
	onPlayTrack: (id: string, pool?: DemoTrack[]) => void;
}

export function SearchTab({
	rowCard,
	searchQuery,
	results,
	catalogTracks,
	catalogLoading,
	catalogError,
	currentTrackId,
	isPlaying,
	onSearchChange,
	onSearchAppleMusic,
	onPlayTrack,
}: SearchTabProps) {
	const trimmed = searchQuery.trim();

	return (
		<>
			<div className="pt-4 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Search</h1>
			</div>
			<div className="px-4 pb-2 shrink-0 space-y-2">
				<form
					onSubmit={e => {
						e.preventDefault();
						if (trimmed) onSearchAppleMusic(trimmed);
					}}
					className="flex items-center gap-2"
				>
					<div className="flex-1 flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
						<SearchIcon
							aria-hidden="true"
							size={14}
							className="text-gray-500 dark:text-gray-400 mr-2 shrink-0"
						/>
						<input
							id="music-search-input"
							name="music-search-input"
							type="text"
							value={searchQuery}
							onChange={e => onSearchChange(e.target.value)}
							placeholder="Artists, Songs, Lyrics, and More"
							aria-label="Search songs"
							className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => onSearchChange('')}
								aria-label="Clear search"
								className="text-gray-500 dark:text-gray-400 ml-2"
							>
								<X aria-hidden="true" size={14} />
							</button>
						)}
					</div>
					{trimmed && (
						<button
							type="submit"
							disabled={catalogLoading}
							className="px-3 py-2 rounded-xl bg-[#fa2d48] text-white text-xs font-semibold shrink-0 active:scale-95 transition-transform disabled:opacity-50"
						>
							{catalogLoading ? (
								<LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
							) : (
								'Apple Music'
							)}
						</button>
					)}
				</form>
				<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
					{FEATURED_ARTISTS.map(artist => (
						<button
							key={artist}
							type="button"
							onClick={() => {
								onSearchChange(artist);
								onSearchAppleMusic(artist);
							}}
							className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-[#fa2d48]/15 hover:text-[#fa2d48] transition-colors shrink-0"
						>
							{artist}
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 overflow-y-auto pb-4 space-y-4">
				{catalogTracks.length > 0 && (
					<div>
						<div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wider text-[#fa2d48]">
							Apple Music Catalog (30s Preview)
						</div>
						<div className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}>
							{catalogTracks.map((t, i) => {
								const isCurrent = t.id === currentTrackId;
								return (
									<button
										key={t.id}
										onClick={() => onPlayTrack(t.id, catalogTracks)}
										aria-label={`Play ${t.title} by ${t.artist}`}
										className={`w-full flex items-center gap-3 px-3 py-2 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
											i < catalogTracks.length - 1
												? 'border-b border-black/5 dark:border-white/10'
												: ''
										}`}
									>
										<TrackArt track={t} />
										<span className="min-w-0 flex-1">
											<span
												className={`flex items-center gap-1.5 text-base truncate ${
													isCurrent ? 'text-[#fa2d48] font-medium' : 'font-normal'
												}`}
											>
												<span className="truncate">{t.title}</span>
												{isCurrent && (
													<AudioLines
														aria-hidden="true"
														size={14}
														className={`shrink-0 text-[#fa2d48] ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
													/>
												)}
											</span>
											<span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
												{t.artist} · {t.album}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
				{catalogError && (
					<p className="px-4 text-xs text-gray-500 dark:text-gray-400">{catalogError}</p>
				)}
				{results.length === 0 && catalogTracks.length === 0 && !catalogLoading ? (
					<div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 px-8 text-center">
						<p className="text-lg font-semibold mb-1">No Results</p>
						<p className="text-sm">Nothing matches “{trimmed}”.</p>
					</div>
				) : (
					results.length > 0 && (
						<div>
							{catalogTracks.length > 0 && (
								<div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
									In Your Library
								</div>
							)}
							<div className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}>
								{results.map((t, i) => {
									const isCurrent = t.id === currentTrackId;
									return (
										<button
											key={t.id}
											onClick={() => onPlayTrack(t.id, results)}
											aria-label={`Play ${t.title} by ${t.artist}`}
											className={`w-full flex items-center gap-3 px-3 py-2 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
												i < results.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
											}`}
										>
											<TrackArt track={t} />
											<span className="min-w-0 flex-1">
												<span
													className={`flex items-center gap-1.5 text-base truncate ${
														isCurrent ? 'text-[#fa2d48] font-medium' : 'font-normal'
													}`}
												>
													<span className="truncate">{t.title}</span>
													{isCurrent && (
														<AudioLines
															aria-hidden="true"
															size={14}
															className={`shrink-0 text-[#fa2d48] ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
														/>
													)}
												</span>
												<span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
													{t.artist}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)
				)}
			</div>
		</>
	);
}
