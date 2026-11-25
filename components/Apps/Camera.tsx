'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { CameraMode, FILTER_LABELS, FilterType, ZOOM_LEVELS, ZoomLevel } from './Camera/types';
import { useCameraStream } from './Camera/useCameraStream';
import { CameraTopControls } from './Camera/CameraTopControls';
import { CameraBottomControls } from './Camera/CameraBottomControls';
import { CameraModeSelector } from './Camera/CameraModeSelector';
import { getNextFilter, getVideoStyle } from './Camera/cameraFilters';
import { useCameraCapture } from './Camera/useCameraCapture';
import { triggerHaptic } from '../../utils/haptic';

function formatRecordingDuration(totalSeconds: number): string {
	const mins = Math.floor(totalSeconds / 60);
	const secs = totalSeconds % 60;
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function Camera() {
	const [mode, setMode] = useState<CameraMode>('PHOTO');
	const { videoRef, stream, error, setError, flipCamera, retryCamera } = useCameraStream({ mode });

	const [flashEnabled, setFlashEnabled] = useState(false);
	const [hdrEnabled, setHdrEnabled] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
	const [rotation, setRotation] = useState(0);
	const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
	const [zoom, setZoom] = useState<ZoomLevel>(1);
	const [recordingSeconds, setRecordingSeconds] = useState(0);

	const toggleFlash = useCallback(() => {
		setFlashEnabled(prev => !prev);
	}, []);

	const toggleHdr = useCallback(() => {
		setHdrEnabled(prev => !prev);
	}, []);

	const toggleTimer = useCallback(() => {
		setTimerSeconds(prev => {
			if (prev === 0) return 3;
			if (prev === 3) return 10;
			return 0;
		});
	}, []);

	const toggleFilter = useCallback(() => {
		setCurrentFilter(getNextFilter);
	}, []);

	const rotateCamera = useCallback(() => {
		setRotation(prev => (prev + 90) % 360);
	}, []);

	const { canvasRef, countdown, isFlashing, lastPhoto, isRecording, handleShutterClick } =
		useCameraCapture({
			mode,
			videoRef,
			stream,
			setError,
			flashEnabled,
			hdrEnabled,
			timerSeconds,
			rotation,
			currentFilter,
			zoom,
		});

	useEffect(() => {
		if (!isRecording) {
			setRecordingSeconds(0);
			return;
		}
		const interval = setInterval(() => {
			setRecordingSeconds(prev => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [isRecording]);

	return (
		<div className="flex flex-col h-full w-full font-sans bg-black text-white overflow-hidden relative select-none">
			<CameraTopControls
				flashEnabled={flashEnabled}
				toggleFlash={toggleFlash}
				hdrEnabled={hdrEnabled}
				toggleHdr={toggleHdr}
				timerSeconds={timerSeconds}
				toggleTimer={toggleTimer}
				currentFilter={currentFilter}
				toggleFilter={toggleFilter}
				rotateCamera={rotateCamera}
			/>

			{/* Active Filter Badge Pill */}
			{currentFilter !== 'none' && !isRecording && (
				<div className="absolute top-24 md:top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
					<span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wide text-ios-yellow">
						{FILTER_LABELS[currentFilter]}
					</span>
				</div>
			)}

			{/* Flash Effect Overlay */}
			{isFlashing && (
				<div className="absolute inset-0 bg-white z-30 pointer-events-none animate-in fade-out duration-200" />
			)}

			{/* Countdown Overlay */}
			{countdown !== null && (
				<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
					<div className="text-9xl font-bold text-white animate-pulse">{countdown}</div>
				</div>
			)}

			{/* Live Recording Timer Pill */}
			{isRecording && (
				<div
					role="status"
					aria-live="polite"
					className="absolute top-24 md:top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-ios-red px-3.5 py-1 rounded-full shadow-lg"
				>
					<div className="w-2 h-2 bg-white rounded-full animate-pulse" />
					<span className="text-xs font-semibold text-white tracking-wider tabular-nums">
						{formatRecordingDuration(recordingSeconds)}
					</span>
				</div>
			)}

			{/* SQUARE Mode - Black Bars Overlay */}
			<div
				className="absolute top-0 left-0 right-0 bg-black z-10 pointer-events-none transition-all duration-300 ease-out"
				style={{ height: mode === 'SQUARE' ? '10%' : '0%' }}
			/>
			<div
				className="absolute bottom-0 left-0 right-0 bg-black z-10 pointer-events-none transition-all duration-300 ease-out"
				style={{ height: mode === 'SQUARE' ? '15%' : '0%' }}
			/>

			{/* Camera Preview */}
			<div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
				{error ? (
					<div className="flex flex-col items-center justify-center gap-3 px-6 text-center text-white/75">
						<TriangleAlert aria-hidden="true" size={36} className="text-ios-yellow" />
						<p className="text-sm max-w-xs">{error}</p>
						<button
							type="button"
							onClick={() => {
								triggerHaptic('light');
								retryCamera();
							}}
							className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold active:scale-95 transition-all"
						>
							<RotateCcw aria-hidden="true" size={14} />
							<span>Retry</span>
						</button>
					</div>
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="transition-all duration-300"
						style={getVideoStyle(mode, rotation, currentFilter, zoom, hdrEnabled)}
					/>
				)}
			</div>

			<canvas ref={canvasRef} className="hidden" />

			{/* Lens Zoom Pill (0.5x / 1x / 2x) */}
			{!error && (
				<div className="absolute bottom-44 md:bottom-36 left-0 right-0 z-20 flex justify-center pointer-events-none">
					<div
						role="group"
						aria-label="Camera zoom"
						className="flex items-center gap-1 p-1 rounded-full bg-black/45 backdrop-blur-xl border border-white/10 pointer-events-auto"
					>
						{ZOOM_LEVELS.map(level => {
							const active = zoom === level;
							return (
								<button
									key={level}
									type="button"
									onClick={() => {
										triggerHaptic('light');
										setZoom(level);
									}}
									aria-label={`Zoom ${level}x`}
									aria-pressed={active}
									className={`w-8 h-8 rounded-full text-[11px] font-semibold tabular-nums transition-all active:scale-90 ${
										active
											? 'bg-black/70 text-ios-yellow scale-105'
											: 'text-white/80 hover:text-white'
									}`}
								>
									{level === 0.5 ? '.5' : `${level}x`}
								</button>
							);
						})}
					</div>
				</div>
			)}

			<CameraModeSelector mode={mode} setMode={setMode} />

			<CameraBottomControls
				mode={mode}
				isRecording={isRecording}
				lastPhoto={lastPhoto}
				onShutterClick={handleShutterClick}
				flipCamera={flipCamera}
			/>
		</div>
	);
}
