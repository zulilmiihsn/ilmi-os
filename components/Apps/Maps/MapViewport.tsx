'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import {
	TILE_SIZE,
	clampZoom,
	computeVisibleTiles,
	latLonToWorldPx,
	projectPoint,
	worldPxToLatLon,
	type MapPlace,
	type MapStyle,
} from './mapMath';

interface MapViewportProps {
	center: { lat: number; lon: number };
	zoom: number;
	viewMode: '2D' | '3D';
	mapStyle: MapStyle;
	darkMode: boolean;
	userLocation: { lat: number; lon: number } | null;
	selectedPlace: MapPlace | null;
	showDirections: boolean;
	onMoveCenter: (next: { lat: number; lon: number }) => void;
	onChangeZoom: (nextZoom: number) => void;
}

export function MapViewport({
	center,
	zoom,
	viewMode,
	mapStyle,
	darkMode,
	userLocation,
	selectedPlace,
	showDirections,
	onMoveCenter,
	onChangeZoom,
}: MapViewportProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 800, height: 600 });
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragRef = useRef<{ startX: number; startY: number; active: boolean }>({
		startX: 0,
		startY: 0,
		active: false,
	});

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const update = () => {
			setSize({ width: Math.max(320, el.clientWidth), height: Math.max(320, el.clientHeight) });
		};
		update();
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const tiles = useMemo(
		() =>
			computeVisibleTiles(
				center.lat,
				center.lon,
				zoom,
				size.width,
				size.height,
				darkMode,
				mapStyle
			),
		[center.lat, center.lon, zoom, size.width, size.height, darkMode, mapStyle]
	);

	const userPt = useMemo(
		() =>
			userLocation
				? projectPoint(
						userLocation.lat,
						userLocation.lon,
						center.lat,
						center.lon,
						zoom,
						size.width,
						size.height
					)
				: null,
		[userLocation, center.lat, center.lon, zoom, size.width, size.height]
	);

	const pinPt = useMemo(
		() =>
			selectedPlace
				? projectPoint(
						selectedPlace.lat,
						selectedPlace.lon,
						center.lat,
						center.lon,
						zoom,
						size.width,
						size.height
					)
				: null,
		[selectedPlace, center.lat, center.lon, zoom, size.width, size.height]
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		dragRef.current = { startX: e.clientX, startY: e.clientY, active: true };
		setIsDragging(true);
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragRef.current.active) return;
		setDragOffset({
			x: e.clientX - dragRef.current.startX,
			y: e.clientY - dragRef.current.startY,
		});
	};

	const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragRef.current.active) return;
		dragRef.current.active = false;
		setIsDragging(false);
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		const dx = e.clientX - dragRef.current.startX;
		const dy = e.clientY - dragRef.current.startY;
		setDragOffset({ x: 0, y: 0 });
		if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
		const world = latLonToWorldPx(center.lat, center.lon, zoom);
		const next = worldPxToLatLon(world.x - dx, world.y - dy, zoom);
		onMoveCenter(next);
	};

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		if (Math.abs(e.deltaY) < 4) return;
		onChangeZoom(clampZoom(zoom + (e.deltaY < 0 ? 1 : -1)));
	};

	return (
		<div
			ref={containerRef}
			role="application"
			aria-label="Interactive map canvas"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={finishDrag}
			onPointerCancel={finishDrag}
			onWheel={handleWheel}
			onDoubleClick={() => onChangeZoom(clampZoom(zoom + 1))}
			className={`absolute inset-0 z-0 overflow-hidden cursor-grab active:cursor-grabbing touch-none ${
				darkMode || mapStyle === 'satellite' ? 'bg-[#12161f]' : 'bg-[#e8ece8]'
			}`}
		>
			{/* Quiet offline fallback backdrop behind live raster tiles (dark / satellite only) */}
			{(darkMode || mapStyle === 'satellite') && (
				<Image
					src="/media/apple_maps_dark_3d_background.webp"
					alt="Map fallback background"
					fill
					className="object-cover pointer-events-none opacity-40"
					priority
					quality={75}
					draggable={false}
				/>
			)}

			{/* Live slippy tile layer + 3D perspective */}
			<div
				className={`absolute inset-0 will-change-transform ${
					isDragging ? '' : 'transition-transform duration-500 ease-out'
				}`}
				style={{
					transform:
						viewMode === '3D'
							? `perspective(900px) rotateX(34deg) scale(1.22) translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
							: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
					transformOrigin: 'center 60%',
				}}
			>
				{tiles.map(tile => (
					<Image
						key={tile.key}
						src={tile.url}
						alt=""
						width={TILE_SIZE}
						height={TILE_SIZE}
						unoptimized
						draggable={false}
						className="absolute max-w-none select-none pointer-events-none"
						style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
					/>
				))}

				{/* Route line when Directions is active */}
				{showDirections && userPt && pinPt && (
					<svg
						aria-hidden="true"
						className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
					>
						<line
							x1={userPt.x}
							y1={userPt.y}
							x2={pinPt.x}
							y2={pinPt.y}
							stroke={darkMode || mapStyle === 'satellite' ? '#0a84ff' : '#007aff'}
							strokeWidth="5"
							strokeLinecap="round"
							strokeDasharray="10 8"
						/>
					</svg>
				)}

				{/* User pulsing blue GPS dot */}
				{userPt && (
					<div
						className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
						style={{ left: userPt.x, top: userPt.y }}
					>
						<span className="block w-14 h-14 rounded-full bg-ios-blue/20 animate-ping" />
						<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ios-blue border-[3px] border-white shadow-lg" />
					</div>
				)}

				{/* Apple Maps red teardrop pin */}
				{selectedPlace && pinPt && (
					<div
						className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center"
						style={{ left: pinPt.x, top: pinPt.y }}
					>
						<div className="px-2 py-0.5 mb-1 rounded-md bg-white/95 dark:bg-[#1c1c1e]/95 text-black dark:text-white text-[11px] font-semibold shadow-md whitespace-nowrap border border-black/10 dark:border-white/15">
							{selectedPlace.name}
						</div>
						<div className="w-8 h-8 rounded-full bg-ios-red text-white flex items-center justify-center shadow-lg border-2 border-white">
							<MapPin aria-hidden="true" size={16} />
						</div>
					</div>
				)}
			</div>

			{/* Attribution (stays visible above bottom sheet on narrow layouts) */}
			<div className="absolute top-4 left-3 @2xl:top-auto @2xl:left-auto @2xl:bottom-2 @2xl:right-3 z-[15] px-1.5 py-0.5 rounded bg-white/75 dark:bg-black/55 backdrop-blur-xs text-[9px] text-black/70 dark:text-white/75 pointer-events-none">
				{mapStyle === 'satellite' ? '© Esri, Maxar · OpenStreetMap' : '© OpenStreetMap · CARTO'}
			</div>
		</div>
	);
}
