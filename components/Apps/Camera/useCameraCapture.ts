'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type React from 'react';
import { generateId } from '../../../utils/id';
import {
	appendPhoto,
	computeScaledDimensions,
	loadPhotos,
	MAX_PHOTO_DIMENSION,
	PHOTO_JPEG_QUALITY,
	subscribePhotosChanged,
} from '../../../utils/photoStorage';
import { TIMING } from '../../../constants';
import type { CameraMode, FilterType, ZoomLevel } from './types';
import { applyCanvasFilter } from './cameraFilters';

interface UseCameraCaptureOptions {
	mode: CameraMode;
	videoRef: React.RefObject<HTMLVideoElement>;
	stream: MediaStream | null;
	setError: (msg: string) => void;
	flashEnabled: boolean;
	hdrEnabled: boolean;
	timerSeconds: 0 | 3 | 10;
	rotation: number;
	currentFilter: FilterType;
	zoom: ZoomLevel;
}

function savePhotoToStorage(photoData: string, setError: (msg: string) => void): boolean {
	const result = appendPhoto({
		id: generateId('photo'),
		url: photoData,
		date: new Date().toISOString(),
		type: 'photo',
		source: 'camera',
		isFavorite: false,
	});
	if (!result.ok) {
		setError(result.message);
		return false;
	}
	return true;
}

export function useCameraCapture({
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
}: UseCameraCaptureOptions) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [countdown, setCountdown] = useState<number | null>(null);
	const [isFlashing, setIsFlashing] = useState(false);
	const [lastPhoto, setLastPhoto] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);

	// Keep the bottom-left gallery thumbnail in sync with stored photos.
	useEffect(() => {
		const syncLatest = () => {
			const loaded = loadPhotos();
			setLastPhoto(loaded.photos[0]?.url ?? null);
		};
		syncLatest();
		return subscribePhotosChanged(syncLatest);
	}, []);

	const cancelCountdown = useCallback(() => {
		if (countdownRef.current) {
			clearInterval(countdownRef.current);
			countdownRef.current = null;
		}
		setCountdown(null);
	}, []);

	const capturePhoto = useCallback(() => {
		if (flashEnabled) {
			setIsFlashing(true);
			setTimeout(() => setIsFlashing(false), TIMING.FLASH_DURATION);
		}

		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;

			let sourceWidth = video.videoWidth;
			let sourceHeight = video.videoHeight;

			if (mode === 'SQUARE') {
				const size = Math.min(sourceWidth, sourceHeight);
				sourceWidth = size;
				sourceHeight = size;
			} else if (mode === 'PANO') {
				sourceHeight = Math.floor(sourceHeight / 2);
			}

			if (zoom > 1) {
				sourceWidth = Math.max(1, Math.floor(sourceWidth / zoom));
				sourceHeight = Math.max(1, Math.floor(sourceHeight / zoom));
			}

			const scaled = computeScaledDimensions(sourceWidth, sourceHeight, MAX_PHOTO_DIMENSION);
			if (scaled.width === 0 || scaled.height === 0) return;

			canvas.width = scaled.width;
			canvas.height = scaled.height;
			const ctx = canvas.getContext('2d');

			if (ctx) {
				ctx.save();
				ctx.translate(scaled.width / 2, scaled.height / 2);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-scaled.width / 2, -scaled.height / 2);

				const sx = (video.videoWidth - sourceWidth) / 2;
				const sy = (video.videoHeight - sourceHeight) / 2;
				ctx.drawImage(video, sx, sy, sourceWidth, sourceHeight, 0, 0, scaled.width, scaled.height);

				if (currentFilter !== 'none' || hdrEnabled) {
					applyCanvasFilter(ctx, scaled.width, scaled.height, currentFilter, hdrEnabled);
				}

				ctx.restore();

				const photoData = canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
				if (savePhotoToStorage(photoData, setError)) {
					setLastPhoto(photoData);
				}
			}
		}
	}, [flashEnabled, hdrEnabled, mode, rotation, currentFilter, zoom, videoRef, setError]);

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

	const handleShutterClick = useCallback(() => {
		if (mode === 'VIDEO' || mode === 'SLO-MO') {
			if (isRecording) {
				stopRecording();
			} else {
				startRecording();
			}
		} else {
			takePhoto();
		}
	}, [mode, isRecording, stopRecording, startRecording, takePhoto]);

	return {
		canvasRef,
		countdown,
		isFlashing,
		lastPhoto,
		isRecording,
		handleShutterClick,
	};
}
