'use client';

import React from 'react';
import Image from 'next/image';
import { triggerHaptic } from '../../../utils/haptic';
import { CameraMode } from './types';

interface CameraBottomControlsProps {
	mode: CameraMode;
	isRecording: boolean;
	lastPhoto: string | null;
	onShutterClick: () => void;
	flipCamera: () => void;
}

export const CameraBottomControls: React.FC<CameraBottomControlsProps> = ({
	mode,
	isRecording,
	lastPhoto,
	onShutterClick,
	flipCamera,
}) => {
	const isVideoMode = mode === 'VIDEO' || mode === 'SLO-MO';

	return (
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
					onClick={onShutterClick}
					className="w-[72px] h-[72px] rounded-full flex items-center justify-center active:scale-90 transition-transform duration-100 border-[3px] border-white/80 p-1 shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-black/20 backdrop-blur-md"
					aria-label={isVideoMode ? (isRecording ? 'Stop recording' : 'Start recording') : 'Take photo'}
				>
					{isVideoMode ? (
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
	);
};
