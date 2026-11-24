'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type React from 'react';
import { generateId } from '../../../utils/id';
import { TIMING } from '../../../constants';
import type { CameraMode, FilterType } from './types';
import { applyCanvasFilter } from './cameraFilters';

interface UseCameraCaptureOptions {
	mode: CameraMode;
	videoRef: React.RefObject<HTMLVideoElement>;
	stream: MediaStream | null;
	setError: (msg: string) => void;
	flashEnabled: boolean;
	timerSeconds: 0 | 3 | 10;
	rotation: number;
	currentFilter: FilterType;
}

function savePhotoToStorage(photoData: string, setError: (msg: string) => void): boolean {
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
		return true;
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
		return false;
	}
}

export function useCameraCapture({
	mode,
	videoRef,
	stream,
	setError,
	flashEnabled,
	timerSeconds,
	rotation,
	currentFilter,
}: UseCameraCaptureOptions) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [countdown, setCountdown] = useState<number | null>(null);
	const [isFlashing, setIsFlashing] = useState(false);
	const [lastPhoto, setLastPhoto] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);

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
					applyCanvasFilter(ctx, width, height, currentFilter);
				}

				ctx.restore();

				const photoData = canvas.toDataURL('image/png');
				if (savePhotoToStorage(photoData, setError)) {
					setLastPhoto(photoData);
				}
			}
		}
	}, [flashEnabled, mode, rotation, currentFilter, videoRef, setError]);

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
