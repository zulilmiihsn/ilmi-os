'use client';

import React from 'react';
import { Clock, RotateCw, Zap } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';
import { FilterType } from './types';

interface CameraTopControlsProps {
	flashEnabled: boolean;
	toggleFlash: () => void;
	hdrEnabled: boolean;
	toggleHdr: () => void;
	timerSeconds: 0 | 3 | 10;
	toggleTimer: () => void;
	currentFilter: FilterType;
	toggleFilter: () => void;
	rotateCamera?: () => void;
}

export const CameraTopControls: React.FC<CameraTopControlsProps> = ({
	flashEnabled,
	toggleFlash,
	hdrEnabled,
	toggleHdr,
	timerSeconds,
	toggleTimer,
	currentFilter,
	toggleFilter,
	rotateCamera,
}) => {
	return (
		<div className="absolute top-12 left-4 right-4 z-20 flex justify-center pointer-events-none">
			<div className="bg-black/40 backdrop-blur-2xl border border-white/15 px-4 py-2 rounded-full shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] flex items-center gap-6 pointer-events-auto">
				{/* Flash Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						toggleFlash();
					}}
					className="relative w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1.5 after:content-['']"
					aria-label={flashEnabled ? 'Disable flash' : 'Enable flash'}
				>
					<Zap aria-hidden="true" size={14} className={flashEnabled ? 'text-ios-yellow' : 'text-white/80'} />
				</button>

				{/* HDR Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						toggleHdr();
					}}
					className={`relative text-xs font-bold tracking-tight active:scale-90 transition-transform after:absolute after:-inset-x-2 after:-inset-y-3.5 after:content-[''] ${
						hdrEnabled ? 'text-ios-yellow' : 'text-white/80'
					}`}
					aria-label={hdrEnabled ? 'Disable HDR' : 'Enable HDR'}
				>
					HDR
				</button>

				{/* Timer Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						toggleTimer();
					}}
					className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform relative after:absolute after:-inset-1.5 after:content-['']"
					aria-label="Toggle camera timer"
				>
					<Clock aria-hidden="true" size={14} className={timerSeconds > 0 ? 'text-ios-yellow' : 'text-white/80'} />
					{timerSeconds > 0 && (
						<span className="absolute -bottom-1 text-[8px] font-bold text-ios-yellow">{timerSeconds}s</span>
					)}
				</button>

				{/* Filter Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						toggleFilter();
					}}
					className="relative w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1.5 after:content-['']"
					aria-label="Cycle camera filter"
				>
					<div
						className={`w-4 h-4 rounded-full flex items-center justify-center border border-white/30 ${
							currentFilter !== 'none' ? 'bg-ios-yellow' : 'bg-white/20'
						}`}
					>
						<span className="text-[8px] font-bold text-black">f</span>
					</div>
				</button>

				{/* Rotate Orientation Toggle */}
				{rotateCamera && (
					<button
						onClick={() => {
							triggerHaptic('light');
							rotateCamera();
						}}
						className="relative w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform after:absolute after:-inset-1.5 after:content-['']"
						aria-label="Rotate camera orientation"
					>
						<RotateCw aria-hidden="true" size={12} className="text-white/80" />
					</button>
				)}
			</div>
		</div>
	);
};
