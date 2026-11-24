'use client';

import React, { useState } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface ControlCenterQuickGridProps {
	flashlight: boolean;
	darkMode: boolean;
	onToggleFlashlight: () => void;
	onToggleDarkMode: () => void;
	onClose: () => void;
	onOpenApp?: (appId: string) => void;
}

const glassTileClass =
	'w-full aspect-square rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] text-white flex items-center justify-center active:scale-88 transition-transform';

export default function ControlCenterQuickGrid({
	flashlight,
	darkMode,
	onToggleFlashlight,
	onToggleDarkMode,
	onClose,
	onOpenApp,
}: ControlCenterQuickGridProps) {
	const [lowPowerMode, setLowPowerMode] = useState(false);

	const openQuickApp = (appId: string) => {
		triggerHaptic('light');
		onClose();
		if (onOpenApp) onOpenApp(appId);
	};

	return (
		<div className="grid grid-cols-4 gap-3 pt-1">
			{/* 1. Calculator App (Liquid Glass Bubble) */}
			<button
				onClick={() => openQuickApp('calculator')}
				className={glassTileClass}
				aria-label="Open Calculator"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="4" y="2" width="16" height="20" rx="4" />
					<line x1="8" y1="6" x2="16" y2="6" strokeWidth="2.6" />
					<line x1="16" y1="14" x2="16" y2="18" strokeWidth="2.6" />
					<path
						d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"
						strokeWidth="3.2"
					/>
				</svg>
			</button>

			{/* 2. Flashlight Toggle (Liquid Glass Bubble) */}
			<button
				onClick={() => {
					triggerHaptic('medium');
					onToggleFlashlight();
				}}
				className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
					flashlight
						? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
						: 'bg-white/10 text-white border-white/20'
				}`}
				aria-label="Toggle Flashlight"
			>
				<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
					<path d="M18 4H6l2 4v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l2-4zm-5 7h-2V9h2v2z" />
				</svg>
			</button>

			{/* 3. Low Power Mode / Battery (Liquid Glass Bubble) */}
			<button
				onClick={() => {
					triggerHaptic('light');
					setLowPowerMode(!lowPowerMode);
				}}
				className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
					lowPowerMode
						? 'bg-ios-yellow text-black border-white/30 shadow-[0_0_20px_rgba(255,204,0,0.7)]'
						: 'bg-white/10 text-white border-white/20'
				}`}
				aria-label="Low Power Mode"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="2" y="6" width="18" height="12" rx="3.5" />
					<line x1="22" y1="10" x2="22" y2="14" strokeWidth="2.8" />
					<rect x="5" y="9" width="7" height="6" rx="1" fill="currentColor" stroke="none" />
				</svg>
			</button>

			{/* 4. Clock / Timer (Liquid Glass Bubble) */}
			<button
				onClick={() => openQuickApp('clock')}
				className={glassTileClass}
				aria-label="Open Clock"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="13" r="8" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="13" x2="15.5" y2="13" />
					<polyline points="10 2 12 2 14 2" />
				</svg>
			</button>

			{/* 5. Dark Mode (Liquid Glass Bubble) */}
			<button
				onClick={() => {
					triggerHaptic('light');
					onToggleDarkMode();
				}}
				className={`w-full aspect-square rounded-full shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all active:scale-88 border ${
					darkMode ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20'
				}`}
				aria-label="Toggle Dark Mode"
			>
				<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
					<path d="M12 3a9 9 0 0 0 0 18z" />
				</svg>
			</button>

			{/* 6. Notes App (Liquid Glass Bubble) */}
			<button
				onClick={() => openQuickApp('notes')}
				className={glassTileClass}
				aria-label="Open Notes"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" y1="13" x2="8" y2="13" strokeWidth="2.6" />
					<line x1="16" y1="17" x2="8" y2="17" strokeWidth="2.6" />
					<polyline points="10 9 9 9 8 9" strokeWidth="2.6" />
				</svg>
			</button>

			{/* 7. Photos App (Liquid Glass Bubble) */}
			<button
				onClick={() => openQuickApp('photos')}
				className={glassTileClass}
				aria-label="Open Photos"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="4" />
					<circle cx="8.5" cy="8.5" r="1.8" fill="currentColor" stroke="none" />
					<polyline points="21 15 16 10 5 21" strokeWidth="2.6" />
				</svg>
			</button>

			{/* 8. Camera App (Liquid Glass Bubble) */}
			<button
				onClick={() => openQuickApp('camera')}
				className={glassTileClass}
				aria-label="Open Camera"
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
					<circle cx="12" cy="13" r="4.2" strokeWidth="2.6" />
				</svg>
			</button>
		</div>
	);
}
