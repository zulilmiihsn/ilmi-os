'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraMode } from './types';

interface UseCameraStreamProps {
	mode: CameraMode;
}

export function useCameraStream({ mode }: UseCameraStreamProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<string>('');
	const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

	useEffect(() => {
		let isMounted = true;

		const initCamera = async () => {
			// Stop previous active tracks
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop());
				streamRef.current = null;
			}

			const constraints = [
				{
					video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
					audio: mode === 'VIDEO' || mode === 'SLO-MO',
				},
				{
					video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
					audio: mode === 'VIDEO' || mode === 'SLO-MO',
				},
				{
					video: { facingMode },
					audio: mode === 'VIDEO' || mode === 'SLO-MO',
				},
			];

			for (const constraint of constraints) {
				try {
					const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
					if (!isMounted) {
						mediaStream.getTracks().forEach(track => track.stop());
						return;
					}
					streamRef.current = mediaStream;
					setStream(mediaStream);
					if (videoRef.current) {
						videoRef.current.srcObject = mediaStream;
					}
					setError('');
					return;
				} catch {
					// Fall back to next constraint
				}
			}

			if (isMounted) {
				setError('Could not start camera. Please check permissions and close other apps using the camera.');
			}
		};

		initCamera();

		return () => {
			isMounted = false;
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop());
				streamRef.current = null;
			}
		};
	}, [facingMode, mode]);

	const flipCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop());
		}
		setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
	}, []);

	return {
		videoRef,
		stream,
		error,
		setError,
		facingMode,
		flipCamera,
	};
}
