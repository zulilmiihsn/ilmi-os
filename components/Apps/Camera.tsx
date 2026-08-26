'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { TIMING } from '../../constants';
import { triggerHaptic } from '../../utils/haptic';

type CameraMode = 'SLO-MO' | 'VIDEO' | 'PHOTO' | 'SQUARE' | 'PANO';
type FilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cool';

export default function Camera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [mode, setMode] = useState<CameraMode>('PHOTO');
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isFlashing, setIsFlashing] = useState(false);
    const [lastPhoto, setLastPhoto] = useState<string | null>(null);
    const [hdrEnabled, setHdrEnabled] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
    const [isRecording, setIsRecording] = useState(false);

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
                    video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
                    audio: mode === 'VIDEO' || mode === 'SLO-MO'
                },
                {
                    video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: mode === 'VIDEO' || mode === 'SLO-MO'
                },
                {
                    video: { facingMode: facingMode },
                    audio: mode === 'VIDEO' || mode === 'SLO-MO'
                }
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
                    // Try next fallback
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

    const takePhoto = () => {

        if (timerSeconds > 0) {
            startCountdown();
        } else {
            capturePhoto();
        }
    };

    const startCountdown = () => {
        let count = timerSeconds;
        setCountdown(count);

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                setCountdown(null);
                clearInterval(interval);
                capturePhoto();
            }
        }, 1000);
    };

    const capturePhoto = () => {
        if (flashEnabled) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), TIMING.FLASH_DURATION);
        }

        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas size based on mode
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (mode === 'SQUARE') {
                // 1:1 aspect ratio (perfect square)
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
                // Apply rotation
                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-width / 2, -height / 2);

                // Draw video
                const sx = (video.videoWidth - width) / 2;
                const sy = (video.videoHeight - height) / 2;
                ctx.drawImage(video, sx, sy, width, height, 0, 0, width, height);

                // Apply filter
                if (currentFilter !== 'none') {
                    applyCanvasFilter(ctx, width, height);
                }

                ctx.restore();

                const photoData = canvas.toDataURL('image/png');
                setLastPhoto(photoData);

                // Save to localStorage
                try {
                    const existingPhotos = JSON.parse(localStorage.getItem('camera_photos') || '[]');
                    const newPhoto = {
                        id: Date.now().toString(),
                        url: photoData,
                        date: new Date().toISOString(),
                        type: 'photo'
                    };
                    localStorage.setItem('camera_photos', JSON.stringify([newPhoto, ...existingPhotos]));
                } catch (e) {
                    console.error('Failed to save photo to localStorage', e);
                    setError('Storage full! Delete some photos.');
                }
            }
        }
    };

    const applyCanvasFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (currentFilter === 'grayscale') {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            } else if (currentFilter === 'sepia') {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            } else if (currentFilter === 'vintage') {
                data[i] = Math.min(255, data[i] * 1.2);
                data[i + 2] = Math.min(255, data[i + 2] * 0.8);
            } else if (currentFilter === 'cool') {
                data[i + 2] = Math.min(255, data[i + 2] * 1.2);
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const toggleVideoRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        if (!stream) return;

        const chunks: Blob[] = [];
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm'
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `video-${Date.now()}.webm`;
            link.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const flipCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const toggleTimer = () => {
        setTimerSeconds(prev => {
            if (prev === 0) return 3;
            if (prev === 3) return 10;
            return 0;
        });
    };

    const toggleFilter = () => {
        setCurrentFilter(prev => {
            if (prev === 'none') return 'grayscale';
            if (prev === 'grayscale') return 'sepia';
            if (prev === 'sepia') return 'vintage';
            if (prev === 'vintage') return 'cool';
            return 'none';
        });
    };

    const rotateCamera = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleShutterClick = () => {
        if (mode === 'VIDEO' || mode === 'SLO-MO') {
            toggleVideoRecording();
        } else {
            takePhoto();
        }
    };

    const getVideoStyle = () => {
        const style: React.CSSProperties = {
            transform: `rotate(${rotation}deg)`,
            objectFit: 'cover' as const,
            width: '100%',
            height: '100%'
        };

        if (mode === 'PANO') {
            // Wide panorama
            style.objectFit = 'contain';
            style.width = '100%';
            style.height = '40%';
        }

        let filter = '';
        if (currentFilter === 'grayscale') filter = 'grayscale(100%)';
        else if (currentFilter === 'sepia') filter = 'sepia(100%)';
        else if (currentFilter === 'vintage') filter = 'sepia(50%) contrast(1.2)';
        else if (currentFilter === 'cool') filter = 'hue-rotate(180deg) saturate(1.2)';

        if (hdrEnabled) {
            filter += ' contrast(1.2) brightness(1.1)';
        }

        if (filter) {
            style.filter = filter;
        }

        return style;
    };

    const modes: CameraMode[] = ['SLO-MO', 'VIDEO', 'PHOTO', 'SQUARE', 'PANO'];

    return (
        <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden relative select-none">
            {/* iOS 26 Liquid Glass Top Control Island */}
            <div className="absolute top-12 left-4 right-4 z-20 flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/15 px-4 py-2 rounded-full shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] flex items-center gap-6 pointer-events-auto">
                    {/* Flash Toggle */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            toggleFlash();
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        aria-label={flashEnabled ? "Disable flash" : "Enable flash"}
                    >
                        <i className={`fas fa-bolt text-sm ${flashEnabled ? 'text-[#ffcc00]' : 'text-white/80'}`}></i>
                    </button>

                    {/* HDR Toggle */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            toggleHdr();
                        }}
                        className={`text-xs font-bold tracking-tight active:scale-90 transition-transform ${
                            hdrEnabled ? 'text-[#ffcc00]' : 'text-white/80'
                        }`}
                        aria-label={hdrEnabled ? "Disable HDR" : "Enable HDR"}
                    >
                        HDR
                    </button>

                    {/* Timer Toggle */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            toggleTimer();
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform relative"
                    >
                        <i className={`fas fa-clock text-sm ${timerSeconds > 0 ? 'text-[#ffcc00]' : 'text-white/80'}`}></i>
                        {timerSeconds > 0 && (
                            <span className="absolute -bottom-1 text-[8px] font-bold text-[#ffcc00]">{timerSeconds}s</span>
                        )}
                    </button>

                    {/* Filter */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            toggleFilter();
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border border-white/30 ${
                            currentFilter !== 'none' ? 'bg-[#ffcc00]' : 'bg-white/20'
                        }`}>
                            <span className="text-[8px] font-bold text-black">f</span>
                        </div>
                    </button>
                </div>
            </div>

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

            {/* Mode Selector Pill Carousel */}
            <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center">
                <div className="flex items-center gap-5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                    {modes.map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                triggerHaptic('light');
                                setMode(m);
                            }}
                            className={`text-xs tracking-wider transition-all duration-200 ${
                                mode === m ? 'text-[#ffcc00] font-bold scale-105' : 'text-white/60 font-medium'
                            }`}
                            aria-label={`Switch to ${m} mode`}
                            role="tab"
                            aria-selected={mode === m}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Controls Floating Area */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-4">
                <div className="flex items-center justify-center gap-14">
                    {/* Gallery Thumbnail */}
                    <button
                        className="w-12 h-12 rounded-xl border border-white/30 overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-md active:scale-90 transition-transform shadow-md"
                        aria-label="View recent photos"
                    >
                        {lastPhoto ? (
                            <Image
                                src={lastPhoto}
                                alt="Last photo"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized={true}
                            />
                        ) : (
                            <i className="fas fa-image text-white/60 text-base"></i>
                        )}
                    </button>

                    {/* Shutter Button with Liquid Glass Ring */}
                    <button
                        onClick={handleShutterClick}
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center active:scale-90 transition-transform duration-100 border-[3px] border-white/80 p-1 shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-black/20 backdrop-blur-md"
                        aria-label={mode === 'VIDEO' || mode === 'SLO-MO' ? (isRecording ? "Stop recording" : "Start recording") : "Take photo"}
                    >
                        {mode === 'VIDEO' || mode === 'SLO-MO' ? (
                            isRecording ? (
                                <div className="w-[28px] h-[28px] bg-[#ff3b30] rounded-md transition-all"></div>
                            ) : (
                                <div className="w-[56px] h-[56px] rounded-full bg-[#ff3b30] transition-all"></div>
                            )
                        ) : (
                            <div className="w-[56px] h-[56px] rounded-full bg-white transition-all shadow-inner"></div>
                        )}
                    </button>

                    {/* Flip Camera */}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            flipCamera();
                        }}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90 transition-transform shadow-md"
                        aria-label="Switch camera"
                    >
                        <i className="fas fa-sync-alt text-white text-base"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
