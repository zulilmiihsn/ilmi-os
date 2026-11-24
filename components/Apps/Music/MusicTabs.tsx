'use client';

import { Star, X } from 'lucide-react';
import { DEMO_TRACKS, formatPlayerTime, type DemoTrack } from './library';
import { TrackArt } from './TrackArt';

interface LibraryTabProps {
	rowCard: string;
	liked: string[];
	onPlayTrack: (id: string) => void;
	onToggleLike: (id: string) => void;
}

export function LibraryTab({ rowCard, liked, onPlayTrack, onToggleLike }: LibraryTabProps) {
	return (
		<>
			<div className="pt-10 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Library</h1>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				<div className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${rowCard}`}>
					{DEMO_TRACKS.map((t, i) => (
						<div
							key={t.id}
							className={`flex items-center gap-3 pl-3 pr-2 py-2 ${
								i < DEMO_TRACKS.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
							}`}
						>
							<button
								onClick={() => onPlayTrack(t.id)}
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
								onClick={() => onToggleLike(t.id)}
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
	);
}

interface SearchTabProps {
	rowCard: string;
	searchQuery: string;
	results: DemoTrack[];
	onSearchChange: (value: string) => void;
	onPlayTrack: (id: string) => void;
}

export function SearchTab({
	rowCard,
	searchQuery,
	results,
	onSearchChange,
	onPlayTrack,
}: SearchTabProps) {
	return (
		<>
			<div className="pt-10 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Search</h1>
			</div>
			<div className="px-4 pb-3 shrink-0">
				<div className="flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
					<input
						type="text"
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						placeholder="Songs and artists"
						aria-label="Search songs"
						className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400 min-w-0"
					/>
					{searchQuery && (
						<button
							onClick={() => onSearchChange('')}
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
								onClick={() => onPlayTrack(t.id)}
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
	);
}
