'use client';

import React, { useState, useCallback } from 'react';
import { TriangleAlert } from 'lucide-react';
import { CameraMode, FilterType } from './Camera/types';
import { useCameraStream } from './Camera/useCameraStream';
import { CameraTopControls } from './Camera/CameraTopControls';
import { CameraBottomControls } from './Camera/CameraBottomControls';
import { CameraModeSelector } from './Camera/CameraModeSelector';
import { getNextFilter, getVideoStyle } from './Camera/cameraFilters';
import { useCameraCapture } from './Camera/useCameraCapture';

export default function Camera() {
	const [mode, setMode] = useState<CameraMode>('PHOTO');
	const { videoRef, stream, error, setError, flipCamera } = useCameraStream({ mode });

	const [flashEnabled, setFlashEnabled] = useState(false);
	const [hdrEnabled, setHdrEnabled] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
	const [rotation, setRotation] = useState(0);
	const [currentFilter, setCurrentFilter] = useState<FilterType>('none');

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
			timerSeconds,
			rotation,
			currentFilter,
		});

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

			{/* Flash Effect Overlay */}
			{isFlashing && (
				<div className="absolute inset-0 bg-white z-30 pointer-events-none fade-out duration-200"></div>
			)}

			{/* Countdown Overlay */}
			{countdown !== null && (
				<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
					<div className="text-9xl font-bold text-white animate-pulse">{countdown}</div>
				</div>
			)}

			{/* Recording Indicator */}
			{isRecording && (
				<div className="absolute top-24 left-5 z-30 flex items-center gap-2 bg-ios-red px-3 py-1 rounded-full shadow-lg">
					<div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
					<span className="text-[11px] font-bold text-white tracking-wider">REC</span>
				</div>
			)}

			{/* SQUARE Mode - Black Bars Overlay */}
			<div
				className="absolute top-0 left-0 right-0 bg-black z-10 pointer-events-none transition-all duration-300 ease-out"
				style={{ height: mode === 'SQUARE' ? '10%' : '0%' }}
			></div>
			<div
				className="absolute bottom-0 left-0 right-0 bg-black z-10 pointer-events-none transition-all duration-300 ease-out"
				style={{ height: mode === 'SQUARE' ? '15%' : '0%' }}
			></div>

			{/* Camera Preview */}
			<div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
				{error ? (
					<div className="flex flex-col items-center justify-center gap-2 text-white/70">
						<TriangleAlert aria-hidden="true" size={36} className="mb-4" />
						<p className="text-sm">{error}</p>
					</div>
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="transition-all duration-300"
						style={getVideoStyle(mode, rotation)}
					/>
				)}
			</div>

			<canvas ref={canvasRef} className="hidden" />

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
