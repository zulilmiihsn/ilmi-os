'use client';

import { useState } from 'react';
import {
	Briefcase,
	ExternalLink,
	House,
	LoaderCircle,
	MapPin,
	Navigation,
	Search,
	X,
} from 'lucide-react';
import {
	CURATED_PLACES,
	FAVORITE_PLACES,
	estimateDriveMinutes,
	formatDistance,
	haversineKm,
	type MapPlace,
} from './mapMath';

interface MapsSheetProps {
	darkMode: boolean;
	searchQuery: string;
	searchResults: MapPlace[];
	searching: boolean;
	searchError: string | null;
	selectedPlace: MapPlace | null;
	origin: { lat: number; lon: number };
	showDirections: boolean;
	onSearchChange: (value: string) => void;
	onSearchSubmit: (term: string) => void;
	onSelectPlace: (place: MapPlace) => void;
	onClearSelection: () => void;
	onToggleDirections: () => void;
}

export function MapsSheet({
	darkMode,
	searchQuery,
	searchResults,
	searching,
	searchError,
	selectedPlace,
	origin,
	showDirections,
	onSearchChange,
	onSearchSubmit,
	onSelectPlace,
	onClearSelection,
	onToggleDirections,
}: MapsSheetProps) {
	const [collapsed, setCollapsed] = useState(false);

	const q = searchQuery.trim().toLowerCase();
	const filteredFavorites = FAVORITE_PLACES.filter(
		f => !q || f.place.name.toLowerCase().includes(q) || f.place.subtitle.toLowerCase().includes(q)
	);
	const filteredCurated = CURATED_PLACES.filter(
		p => !q || p.name.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
	);

	const distanceKm = selectedPlace
		? haversineKm(origin.lat, origin.lon, selectedPlace.lat, selectedPlace.lon)
		: null;

	return (
		<div className="absolute bottom-0 left-0 right-0 @2xl:top-4 @2xl:left-4 @2xl:bottom-4 @2xl:right-auto @2xl:w-[320px] z-20 pointer-events-none flex flex-col justify-end @2xl:justify-start">
			<div
				className={`pointer-events-auto backdrop-blur-2xl w-full rounded-t-3xl @2xl:rounded-2xl pb-[max(env(safe-area-inset-bottom),1.25rem)] @2xl:pb-4 pt-2.5 px-4 shadow-2xl border-t @2xl:border ${
					collapsed ? 'max-h-[112px] @2xl:max-h-full' : 'max-h-[58vh] @2xl:max-h-full'
				} overflow-y-auto transition-all duration-300 ${
					darkMode
						? 'bg-[#1c1c1e]/90 border-white/15 text-white'
						: 'bg-white/90 border-black/10 text-black'
				}`}
			>
				{/* Interactive Drag Grabber (narrow / mobile layout) */}
				<button
					type="button"
					onClick={() => setCollapsed(prev => !prev)}
					aria-label={collapsed ? 'Expand maps sheet' : 'Collapse maps sheet'}
					aria-expanded={!collapsed}
					className="w-full py-1.5 mb-2 flex items-center justify-center @2xl:hidden active:opacity-60"
				>
					<span className="w-10 h-1 bg-gray-400/60 rounded-full block" />
				</button>

				{/* Search Capsule */}
				<form
					onSubmit={e => {
						e.preventDefault();
						setCollapsed(false);
						if (searchQuery.trim()) onSearchSubmit(searchQuery);
					}}
					className="flex items-center gap-2 mb-3"
				>
					<div className="flex-1 flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
						<Search
							aria-hidden="true"
							size={14}
							className="text-gray-500 dark:text-gray-400 mr-2 shrink-0"
						/>
						<input
							id="maps-search-input"
							name="maps-search-input"
							type="text"
							className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
							placeholder="Search Maps (e.g. Tokyo, Monas)"
							aria-label="Search Maps"
							value={searchQuery}
							onFocus={() => setCollapsed(false)}
							onChange={e => onSearchChange(e.target.value)}
						/>
						{searching ? (
							<LoaderCircle
								aria-hidden="true"
								size={14}
								className="text-ios-blue animate-spin ml-2"
							/>
						) : (
							searchQuery && (
								<button
									type="button"
									onClick={() => onSearchChange('')}
									aria-label="Clear map search"
									className="text-gray-500 dark:text-gray-400 ml-2"
								>
									<X aria-hidden="true" size={14} />
								</button>
							)
						)}
					</div>
				</form>

				<div className={collapsed ? 'hidden @2xl:block' : ''}>
					{/* Place Detail Card */}
					{selectedPlace && (
						<div className="mb-3 p-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 space-y-2.5">
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<h2 className="text-sm font-semibold truncate">{selectedPlace.name}</h2>
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
										{selectedPlace.category} · {selectedPlace.subtitle}
									</p>
									{distanceKm !== null && (
										<p className="text-[11px] text-ios-blue font-medium mt-0.5 tabular-nums">
											{formatDistance(distanceKm)} · ~{estimateDriveMinutes(distanceKm)} min drive
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={onClearSelection}
									aria-label="Close place details"
									className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center shrink-0"
								>
									<X aria-hidden="true" size={13} />
								</button>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={onToggleDirections}
									className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
										showDirections ? 'bg-ios-green text-white' : 'bg-ios-blue text-white'
									}`}
								>
									<Navigation aria-hidden="true" size={13} />
									{showDirections ? 'Clear Route' : 'Directions'}
								</button>
								<a
									href={`https://maps.apple.com/?ll=${selectedPlace.lat},${selectedPlace.lon}&q=${encodeURIComponent(selectedPlace.name)}`}
									target="_blank"
									rel="noopener noreferrer"
									aria-label="Open in Apple Maps"
									className="py-2 px-3 rounded-xl text-xs font-medium bg-black/10 dark:bg-white/15 flex items-center gap-1 active:scale-95 transition-all"
								>
									<ExternalLink aria-hidden="true" size={12} />
									Open
								</a>
							</div>
						</div>
					)}

					{/* Live Search Results */}
					{searchResults.length > 0 && (
						<div className="mb-3 space-y-1.5">
							<h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
								Search Results
							</h3>
							<div className="space-y-1">
								{searchResults.map(place => (
									<button
										key={place.id}
										type="button"
										onClick={() => onSelectPlace(place)}
										className="w-full text-left p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2.5 transition-colors"
									>
										<span className="w-7 h-7 rounded-full bg-ios-red/15 text-ios-red flex items-center justify-center shrink-0">
											<MapPin aria-hidden="true" size={13} />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-xs font-semibold truncate">{place.name}</span>
											<span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
												{place.subtitle}
											</span>
										</span>
									</button>
								))}
							</div>
						</div>
					)}
					{searchError && (
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">{searchError}</p>
					)}

					{/* Favorites */}
					{filteredFavorites.length > 0 && (
						<div className="space-y-2 mb-3">
							<h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
								Favorites
							</h3>
							<div className="grid grid-cols-2 gap-2">
								{filteredFavorites.map(({ kind, place }) => (
									<button
										key={place.id}
										type="button"
										onClick={() => onSelectPlace(place)}
										aria-label={`Show ${place.name} on map`}
										className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2.5 text-left active:scale-95 transition-all"
									>
										<span
											className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 ${
												kind === 'home' ? 'bg-ios-blue' : 'bg-ios-orange'
											}`}
										>
											{kind === 'home' ? (
												<House aria-hidden="true" size={13} />
											) : (
												<Briefcase aria-hidden="true" size={13} />
											)}
										</span>
										<span className="min-w-0">
											<span className="block text-xs font-semibold truncate">{place.name}</span>
											<span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate">
												{estimateDriveMinutes(
													haversineKm(origin.lat, origin.lon, place.lat, place.lon)
												)}{' '}
												min
											</span>
										</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Curated Guides */}
					{filteredCurated.length > 0 && (
						<div className="space-y-1.5">
							<h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
								Explore Guides
							</h3>
							<div className="space-y-1">
								{filteredCurated.map(place => (
									<button
										key={place.id}
										type="button"
										onClick={() => onSelectPlace(place)}
										className="w-full text-left p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2.5 transition-colors"
									>
										<span className="w-7 h-7 rounded-full bg-ios-blue/15 text-ios-blue flex items-center justify-center shrink-0">
											<MapPin aria-hidden="true" size={13} />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-xs font-semibold truncate">{place.name}</span>
											<span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
												{place.subtitle}
											</span>
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
