'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { generateId } from '../../utils/id';
import { TIMING } from '../../constants';
import { CameraMode, FilterType } from './Camera/types';
import { useCameraStream } from './Camera/useCameraStream';
import { CameraTopControls } from './Camera/CameraTopControls';
import { CameraBottomControls } from './Camera/CameraBottomControls';
import { CameraModeSelector } from './Camera/CameraModeSelector';

export default function Camera() {
	const [mode, setMode] = useState<CameraMode>('PHOTO');
	const { videoRef, stream, error, setError, flipCamera } = useCameraStream({ mode });

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const cancelCountdown = useCallback(() => {
		if (countdownRef.current) {
			clearInterval(countdownRef.current);
			countdownRef.current = null;
		}
		setCountdown(null);
	}, []);

	const [flashEnabled, setFlashEnabled] = useState(false);
	const [hdrEnabled, setHdrEnabled] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [isFlashing, setIsFlashing] = useState(false);
	const [lastPhoto, setLastPhoto] = useState<string | null>(null);
	const [rotation, setRotation] = useState(0);
	const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
	const [isRecording, setIsRecording] = useState(false);

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
		setCurrentFilter(prev => {
			if (prev === 'none') return 'grayscale';
			if (prev === 'grayscale') return 'sepia';
			if (prev === 'sepia') return 'vintage';
			if (prev === 'vintage') return 'cool';
			return 'none';
		});
	}, []);

	const rotateCamera = useCallback(() => {
		setRotation(prev => (prev + 90) % 360);
	}, []);

	const applyCanvasFilter = useCallback(
		(ctx: CanvasRenderingContext2D, width: number, height: number) => {
			const imageData = ctx.getImageData(0, 0, width, height);
			const data = imageData.data;

			for (let i = 0; i < data.length; i += 4) {
				// Indices stay in bounds by loop construction (i+2 <= length-2);
				// fallbacks only satisfy the type checker, never trigger.
				const r0 = data[i] ?? 0;
				const g0 = data[i + 1] ?? 0;
				const b0 = data[i + 2] ?? 0;
				if (currentFilter === 'grayscale') {
					const avg = (r0 + g0 + b0) / 3;
					data[i] = data[i + 1] = data[i + 2] = avg;
				} else if (currentFilter === 'sepia') {
					data[i] = Math.min(255, r0 * 0.393 + g0 * 0.769 + b0 * 0.189);
					data[i + 1] = Math.min(255, r0 * 0.349 + g0 * 0.686 + b0 * 0.168);
					data[i + 2] = Math.min(255, r0 * 0.272 + g0 * 0.534 + b0 * 0.131);
				} else if (currentFilter === 'vintage') {
					data[i] = Math.min(255, r0 * 1.2);
					data[i + 2] = Math.min(255, b0 * 0.8);
				} else if (currentFilter === 'cool') {
					data[i + 2] = Math.min(255, b0 * 1.2);
				}
			}

			ctx.putImageData(imageData, 0, 0);
		},
		[currentFilter]
	);

	const capturePhoto = useCallback(() => {
		if (flashEnabled) {
			setIsFlashing(true);
			setTimeout(() => setIsFlashing(false), TIMING.FLASH_DURATION);
		}

		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;

			let width = video.videoWidth;
			let height = video.videoHeight;

			if (mode === 'SQUARE') {
				const size = Math.min(width, height);
				width = size;
				height = size;
			} else if (mode === 'PANO') {
				height = Math.floor(height / 2);
			}

			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');

			if (ctx) {
				ctx.save();
				ctx.translate(width / 2, height / 2);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-width / 2, -height / 2);

				const sx = (video.videoWidth - width) / 2;
				const sy = (video.videoHeight - height) / 2;
				ctx.drawImage(video, sx, sy, width, height, 0, 0, width, height);

				if (currentFilter !== 'none') {
					applyCanvasFilter(ctx, width, height);
				}

				ctx.restore();

				const photoData = canvas.toDataURL('image/png');

				try {
					const stored = localStorage.getItem('camera_photos') || '[]';
					const existingPhotos: unknown = JSON.parse(stored);
					if (!Array.isArray(existingPhotos)) {
						throw new SyntaxError('Stored camera photos have an unexpected shape');
					}
					const newPhoto = {
						id: generateId('photo'),
						url: photoData,
						date: new Date().toISOString(),
						type: 'photo',
					};
					localStorage.setItem('camera_photos', JSON.stringify([newPhoto, ...existingPhotos]));
					setLastPhoto(photoData);
				} catch (e) {
					console.error('Failed to save photo to localStorage', e);
					if (e instanceof SyntaxError) {
						setError('Saved photos look corrupted. Previously saved photos were kept.');
					} else if (
						e instanceof DOMException &&
						(e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
					) {
						setError('Storage full! Delete some photos, then capture again.');
					} else if (
						e instanceof DOMException &&
						(e.name === 'SecurityError' || e.name === 'NotAllowedError')
					) {
						setError('Storage is not available in this browser session.');
					} else {
						setError('Could not save this photo. It was not stored.');
					}
				}
			}
		}
	}, [flashEnabled, mode, rotation, currentFilter, videoRef, setError, applyCanvasFilter]);

	// Cancel a pending countdown when the capture mode changes or on unmount:
	// a delayed capture must never fire with stale mode/filter settings.
	useEffect(() => {
		return () => cancelCountdown();
	}, [mode, cancelCountdown]);

	const startCountdown = useCallback(() => {
		// Ignore repeated shutter presses while a countdown is already running.
		if (countdownRef.current) return;
		let count = timerSeconds;
		setCountdown(count);

		countdownRef.current = setInterval(() => {
			count--;
			if (count > 0) {
				setCountdown(count);
			} else {
				if (countdownRef.current) {
					clearInterval(countdownRef.current);
					countdownRef.current = null;
				}
				setCountdown(null);
				capturePhoto();
			}
		}, 1000);
	}, [timerSeconds, capturePhoto]);

	const takePhoto = useCallback(() => {
		if (timerSeconds > 0) {
			startCountdown();
		} else {
			capturePhoto();
		}
	}, [timerSeconds, startCountdown, capturePhoto]);

	const startRecording = useCallback(() => {
		if (!stream || isRecording || mediaRecorderRef.current) return;
		if (typeof MediaRecorder === 'undefined') {
			setError('Video recording is not supported in this browser.');
			return;
		}

		const chunks: Blob[] = [];
		let mediaRecorder: MediaRecorder;
		try {
			mediaRecorder = new MediaRecorder(
				stream,
				MediaRecorder.isTypeSupported('video/webm') ? { mimeType: 'video/webm' } : undefined
			);
		} catch {
			setError('Could not start recording with this camera.');
			return;
		}

		mediaRecorder.ondataavailable = e => {
			if (e.data.size > 0) {
				chunks.push(e.data);
			}
		};

		mediaRecorder.onstop = () => {
			// Reconcile UI for every stop path, including automatic stops when
			// the stream ends (camera flip, mode change, unmount).
			if (mediaRecorderRef.current === mediaRecorder) {
				mediaRecorderRef.current = null;
			}
			setIsRecording(false);
			if (chunks.length === 0) return;
			const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `video-${Date.now()}.webm`;
			link.click();
			URL.revokeObjectURL(url);
		};

		mediaRecorder.onerror = () => {
			if (mediaRecorderRef.current === mediaRecorder) {
				mediaRecorderRef.current = null;
			}
			setIsRecording(false);
			setError('Recording failed unexpectedly.');
		};

		try {
			mediaRecorder.start();
		} catch {
			setError('Could not start recording with this camera.');
			return;
		}
		mediaRecorderRef.current = mediaRecorder;
		setIsRecording(true);
	}, [stream, isRecording, setError]);

	const stopRecording = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		// Per the MediaRecorder spec, stop() on an inactive recorder is a
		// no-op; only attempt it while recording or paused.
		if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
			recorder.stop();
		} else {
			mediaRecorderRef.current = null;
			setIsRecording(false);
		}
	}, []);

	const toggleVideoRecording = useCallback(() => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}, [isRecording, stopRecording, startRecording]);

	const handleShutterClick = useCallback(() => {
		if (mode === 'VIDEO' || mode === 'SLO-MO') {
			toggleVideoRecording();
		} else {
			takePhoto();
		}
	}, [mode, toggleVideoRecording, takePhoto]);

	const getVideoStyle = (): React.CSSProperties => {
		const style: React.CSSProperties = {
			transform: `rotate(${rotation}deg)`,
			objectFit: 'cover',
			width: '100%',
			height: '100%',
		};

		if (mode === 'PANO') {
			style.objectFit = 'contain';
			style.width = '100%';
			style.height = '40%';
		}

		return style;
	};

	return (
		<div className="flex flex-col h-full w-full bg-black text-white overflow-hidden relative select-none">
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
				<div className="absolute inset-0 bg-white z-30 pointer-events-none animate-out fade-out duration-200"></div>
			)}

			{/* Countdown Overlay */}
			{countdown !== null && (
				<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
					<div className="text-9xl font-bold text-white animate-pulse">{countdown}</div>
				</div>
			)}

			{/* Recording Indicator */}
			{isRecording && (
				<div className="absolute top-24 left-5 z-30 flex items-center gap-2 bg-[#ff3b30] px-3 py-1 rounded-full shadow-lg">
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
						<i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
						<p className="text-sm">{error}</p>
					</div>
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="transition-all duration-300"
						style={getVideoStyle()}
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
