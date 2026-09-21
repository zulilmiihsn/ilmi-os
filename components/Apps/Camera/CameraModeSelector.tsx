'use client';

import React from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { CameraMode, CAMERA_MODES } from './types';

interface CameraModeSelectorProps {
	mode: CameraMode;
	setMode: (mode: CameraMode) => void;
}

export const CameraModeSelector: React.FC<CameraModeSelectorProps> = ({ mode, setMode }) => {
	return (
		<div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center">
			<div className="flex items-center gap-5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
				{CAMERA_MODES.map(m => (
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
	);
};
