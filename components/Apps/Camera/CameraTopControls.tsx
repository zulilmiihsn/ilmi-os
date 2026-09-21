'use client';

import React from 'react';
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
					className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
					aria-label={flashEnabled ? 'Disable flash' : 'Enable flash'}
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
					className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform relative"
					aria-label="Toggle camera timer"
				>
					<i className={`fas fa-clock text-sm ${timerSeconds > 0 ? 'text-[#ffcc00]' : 'text-white/80'}`}></i>
					{timerSeconds > 0 && (
						<span className="absolute -bottom-1 text-[8px] font-bold text-[#ffcc00]">{timerSeconds}s</span>
					)}
				</button>

				{/* Filter Toggle */}
				<button
					onClick={() => {
						triggerHaptic('light');
						toggleFilter();
					}}
					className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
					aria-label="Cycle camera filter"
				>
					<div
						className={`w-4 h-4 rounded-full flex items-center justify-center border border-white/30 ${
							currentFilter !== 'none' ? 'bg-[#ffcc00]' : 'bg-white/20'
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
						className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
						aria-label="Rotate camera orientation"
					>
						<i className="fas fa-redo text-xs text-white/80"></i>
					</button>
				)}
			</div>
		</div>
	);
};
