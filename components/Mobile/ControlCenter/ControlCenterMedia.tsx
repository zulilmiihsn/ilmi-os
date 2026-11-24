'use client';

import React, { useState } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

export default function ControlCenterMedia() {
	const [isPlaying, setIsPlaying] = useState(false);

	return (
		<div className="bg-white/10 p-3.5 rounded-[38px] border border-white/20 flex flex-col justify-between aspect-square shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_0_rgba(0,0,0,0.25)]">
			{/* Top header row: Glass Artwork Squircle & AirPlay Icon */}
			<div className="flex items-start justify-between">
				{/* Frosted Album Artwork Placeholder */}
				<div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]" />

				{/* AirPlay Audio Circular Disc */}
				<button
					onClick={() => triggerHaptic('light')}
					className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-90 transition-transform"
					aria-label="AirPlay"
				>
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.4"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
						<polygon points="12 15 17 21 7 21 12 15" fill="currentColor" />
					</svg>
				</button>
			</div>

			{/* Title: Not Playing */}
			<div className="px-1">
				<div className="text-[13px] font-semibold text-white/95 tracking-tight drop-shadow-sm">
					Not Playing
				</div>
			</div>

			{/* Player controls: Fixed Bounding Boxes (Zero Layout Shift) & Big Bold Glyphs */}
			<div className="flex items-center justify-center gap-5 text-white pb-1 select-none">
				{/* Previous Track */}
				<button
					onClick={() => triggerHaptic('light')}
					className="w-10 h-10 flex items-center justify-center text-white/45 hover:text-white active:scale-90 transition-transform"
					aria-label="Previous Track"
				>
					<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="11 19 2 12 11 5 11 19" />
						<polygon points="22 19 13 12 22 5 22 19" />
					</svg>
				</button>

				{/* Play / Pause Standalone Glyph (Fixed 44x44 Box to Guarantee Zero Shift) */}
				<button
					onClick={() => {
						triggerHaptic('medium');
						setIsPlaying(!isPlaying);
					}}
					className="w-11 h-11 flex items-center justify-center text-white hover:text-white/90 active:scale-90 transition-transform"
					aria-label="Play/Pause"
				>
					{isPlaying ? (
						<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
							<rect x="5" y="3" width="4.5" height="18" rx="1.5" />
							<rect x="14.5" y="3" width="4.5" height="18" rx="1.5" />
						</svg>
					) : (
						<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="6 3 21 12 6 21 6 3" />
						</svg>
					)}
				</button>

				{/* Next Track */}
				<button
					onClick={() => triggerHaptic('light')}
					className="w-10 h-10 flex items-center justify-center text-white/45 hover:text-white active:scale-90 transition-transform"
					aria-label="Next Track"
				>
					<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="13 19 22 12 13 5 13 19" />
						<polygon points="2 19 11 12 2 5 2 19" />
					</svg>
				</button>
			</div>
		</div>
	);
}
