'use client';

import { useCallback, useRef, useState } from 'react';
import { Compass, Layers, Minus, Navigation, Plus } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import {
	DEFAULT_CENTER,
	clampZoom,
	parseNominatimResults,
	type MapPlace,
	type MapStyle,
} from './Maps/mapMath';
import { MapViewport } from './Maps/MapViewport';
import { MapsSheet } from './Maps/MapsSheet';

export default function Maps() {
	const { darkMode } = useSettingsStore();
	const [center, setCenter] = useState({ lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon });
	const [zoom, setZoom] = useState(DEFAULT_CENTER.zoom);
	const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
	const [mapStyle, setMapStyle] = useState<MapStyle>('explore');
	const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>({
		lat: DEFAULT_CENTER.lat,
		lon: DEFAULT_CENTER.lon,
	});
	const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
	const [showDirections, setShowDirections] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<MapPlace[]>([]);
	const [searching, setSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const searchSeq = useRef(0);

	const handleSelectPlace = useCallback((place: MapPlace) => {
		triggerHaptic('light');
		setSelectedPlace(place);
		setShowDirections(false);
		setCenter({ lat: place.lat, lon: place.lon });
		setZoom(14);
	}, []);

	const handleLocateUser = useCallback(() => {
		triggerHaptic('light');
		if (typeof navigator !== 'undefined' && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				pos => {
					const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
					setUserLocation(loc);
					setCenter(loc);
					setZoom(14);
				},
				() => {
					const fallback = { lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon };
					setUserLocation(fallback);
					setCenter(fallback);
					setZoom(DEFAULT_CENTER.zoom);
				},
				{ timeout: 5000 }
			);
		} else {
			const fallback = { lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon };
			setUserLocation(fallback);
			setCenter(fallback);
		}
	}, []);

	const resetView = useCallback(() => {
		triggerHaptic('light');
		setSearchQuery('');
		setSearchResults([]);
		setSearchError(null);
		setSelectedPlace(null);
		setShowDirections(false);
		setViewMode('2D');
		setCenter({ lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon });
		setZoom(DEFAULT_CENTER.zoom);
	}, []);

	const handleSearchSubmit = useCallback(async (rawTerm: string) => {
		const term = rawTerm.trim();
		if (!term) return;
		const seq = ++searchSeq.current;
		setSearching(true);
		setSearchError(null);
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(term)}`,
				{ headers: { Accept: 'application/json' } }
			);
			if (!res.ok) throw new Error('Geocoder unavailable');
			const json: unknown = await res.json();
			if (seq !== searchSeq.current) return;
			const parsed = parseNominatimResults(json);
			setSearchResults(parsed);
			if (parsed.length === 0) {
				setSearchError(`No locations found for "${term}".`);
			} else if (parsed[0]) {
				setCenter({ lat: parsed[0].lat, lon: parsed[0].lon });
				setZoom(13);
			}
		} catch {
			if (seq !== searchSeq.current) return;
			setSearchError('Could not reach OpenStreetMap search. Try curated guides below.');
		} finally {
			if (seq === searchSeq.current) setSearching(false);
		}
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		setSearchQuery(value);
		if (!value.trim()) {
			setSearchResults([]);
			setSearchError(null);
		}
	}, []);

	const glassBtn =
		'relative w-10 h-10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border bg-white/85 dark:bg-[#1c1c1e]/85 border-black/10 dark:border-white/15';

	return (
		<div
			className={`maps-app @container w-full h-full relative overflow-hidden font-sans select-none ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			<MapViewport
				center={center}
				zoom={zoom}
				viewMode={viewMode}
				mapStyle={mapStyle}
				darkMode={darkMode}
				userLocation={userLocation}
				selectedPlace={selectedPlace}
				showDirections={showDirections}
				onMoveCenter={setCenter}
				onChangeZoom={setZoom}
			/>

			{/* Floating Action Island (Top Right) */}
			<div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
				<button
					type="button"
					onClick={() => {
						triggerHaptic('light');
						setMapStyle(prev => (prev === 'explore' ? 'satellite' : 'explore'));
					}}
					aria-label={mapStyle === 'explore' ? 'Switch to Satellite map' : 'Switch to Explore map'}
					aria-pressed={mapStyle === 'satellite'}
					className={`${glassBtn} ${mapStyle === 'satellite' ? 'text-white bg-ios-blue dark:bg-ios-blue border-transparent' : 'text-ios-blue'}`}
				>
					<Layers aria-hidden="true" size={16} />
				</button>

				<button
					type="button"
					onClick={() => {
						triggerHaptic('light');
						setViewMode(prev => (prev === '3D' ? '2D' : '3D'));
					}}
					aria-label={`Switch to ${viewMode === '3D' ? '2D' : '3D'} view`}
					className={glassBtn}
				>
					<span className="font-bold text-xs tracking-tight text-ios-blue">{viewMode}</span>
				</button>

				<button
					type="button"
					onClick={handleLocateUser}
					aria-label="Show my location"
					aria-pressed={userLocation !== null}
					className={`${glassBtn} text-ios-blue`}
				>
					<Navigation aria-hidden="true" size={14} />
				</button>

				<button
					type="button"
					onClick={resetView}
					aria-label="Reset view"
					className={`${glassBtn} text-ios-red`}
				>
					<Compass aria-hidden="true" size={16} />
				</button>

				<div className="backdrop-blur-2xl rounded-full shadow-lg border bg-white/85 dark:bg-[#1c1c1e]/85 border-black/10 dark:border-white/15 flex flex-col overflow-hidden">
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setZoom(z => clampZoom(z + 1));
						}}
						aria-label="Zoom in"
						className="w-10 h-9 flex items-center justify-center active:opacity-50 border-b border-black/10 dark:border-white/10"
					>
						<Plus aria-hidden="true" size={15} />
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setZoom(z => clampZoom(z - 1));
						}}
						aria-label="Zoom out"
						className="w-10 h-9 flex items-center justify-center active:opacity-50"
					>
						<Minus aria-hidden="true" size={15} />
					</button>
				</div>
			</div>

			<MapsSheet
				darkMode={darkMode}
				searchQuery={searchQuery}
				searchResults={searchResults}
				searching={searching}
				searchError={searchError}
				selectedPlace={selectedPlace}
				origin={userLocation ?? { lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon }}
				showDirections={showDirections}
				onSearchChange={handleSearchChange}
				onSearchSubmit={handleSearchSubmit}
				onSelectPlace={handleSelectPlace}
				onClearSelection={() => {
					setSelectedPlace(null);
					setShowDirections(false);
				}}
				onToggleDirections={() => {
					triggerHaptic('light');
					setShowDirections(prev => !prev);
				}}
			/>
		</div>
	);
}
