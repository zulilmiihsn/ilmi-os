'use client';

import React, { useState } from 'react';
import { BedDouble, Briefcase, Moon, User, type LucideIcon } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';

// Icon keys from focus data mapped to Lucide.
const FOCUS_ICONS: Record<string, LucideIcon> = {
	moon: Moon,
	briefcase: Briefcase,
	user: User,
	bed: BedDouble,
};

const getFocusInfo = (activeFocus: string | null) => {
	if (activeFocus === 'Do Not Disturb') {
		return {
			label: 'Do Not Disturb',
			icon: 'moon',
			bg: 'bg-ios-indigo',
			shadow: 'shadow-[0_0_18px_rgba(88,86,214,0.6)]',
			border: 'border-white/30',
		};
	}
	if (activeFocus === 'Work') {
		return {
			label: 'Work',
			icon: 'briefcase',
			bg: 'bg-ios-blue',
			shadow: 'shadow-[0_0_18px_rgba(0,122,255,0.6)]',
			border: 'border-white/30',
		};
	}
	if (activeFocus === 'Personal') {
		return {
			label: 'Personal',
			icon: 'user',
			bg: 'bg-ios-orange',
			shadow: 'shadow-[0_0_18px_rgba(255,149,0,0.6)]',
			border: 'border-white/30',
		};
	}
	if (activeFocus === 'Sleep') {
		return {
			label: 'Sleep',
			icon: 'bed',
			bg: 'bg-ios-green',
			shadow: 'shadow-[0_0_18px_rgba(52,199,89,0.6)]',
			border: 'border-white/30',
		};
	}
	return {
		label: 'Focus',
		icon: 'moon',
		bg: 'bg-white/10',
		shadow: 'shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
		border: 'border-white/20',
	};
};

type FocusMode = 'Do Not Disturb' | 'Work' | 'Personal' | 'Sleep' | null;

interface ControlCenterFocusSectionProps {
	orientationLock: boolean;
	silentMode: boolean;
	activeFocus: FocusMode;
	onToggleOrientationLock: () => void;
	onToggleSilentMode: () => void;
	onSetActiveFocus: (focus: FocusMode) => void;
}

export default function ControlCenterFocusSection({
	orientationLock,
	silentMode,
	activeFocus,
	onToggleOrientationLock,
	onToggleSilentMode,
	onSetActiveFocus,
}: ControlCenterFocusSectionProps) {
	const [flipDegree, setFlipDegree] = useState(0);

	// 3D Flip Focus Cycle
	const handleFocusCycle = () => {
		triggerHaptic('medium');
		setFlipDegree(prev => prev + 360);

		if (!activeFocus) {
			onSetActiveFocus('Do Not Disturb');
		} else if (activeFocus === 'Do Not Disturb') {
			onSetActiveFocus('Work');
		} else if (activeFocus === 'Work') {
			onSetActiveFocus('Personal');
		} else if (activeFocus === 'Personal') {
			onSetActiveFocus('Sleep');
		} else {
			onSetActiveFocus(null);
		}
	};

	const focusInfo = getFocusInfo(activeFocus);
	const FocusIcon = FOCUS_ICONS[focusInfo.icon] ?? Moon;

	return (
		<div className="flex flex-col justify-between">
			{/* Top Row: 2 Big Circular Solid-White / Red Buttons (Exact iOS Screenshot) */}
			<div className="flex items-center justify-between gap-3">
				{/* Orientation Lock (Dynamic Active White/Red vs Inactive Liquid Glass) */}
				<button
					onClick={() => {
						triggerHaptic('light');
						onToggleOrientationLock();
					}}
					className={`w-[72px] h-[72px] rounded-full border flex items-center justify-center transition-all active:scale-90 ${
						orientationLock
							? 'bg-white text-ios-red border-white/40 shadow-[0_4px_18px_rgba(0,0,0,0.25)]'
							: 'bg-white/10 text-white border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
					}`}
					aria-label="Orientation Lock"
				>
					<svg
						width="34"
						height="34"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.6"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21.5 12a9.5 9.5 0 1 1-2.78-6.72L21.5 8" />
						<polyline points="21.5 3 21.5 8 16.5 8" />
						<rect
							x="9.5"
							y="11.5"
							width="5"
							height="4.5"
							rx="1"
							fill="currentColor"
							stroke="none"
						/>
						<path d="M10.5 11.5V9.5a1.5 1.5 0 0 1 3 0v2" stroke="currentColor" strokeWidth="2" />
					</svg>
				</button>

				{/* Silent Mode / Bell (Dynamic Active White/Red vs Inactive Liquid Glass) */}
				<button
					onClick={() => {
						triggerHaptic('light');
						onToggleSilentMode();
					}}
					className={`w-[72px] h-[72px] rounded-full border flex items-center justify-center transition-all active:scale-90 ${
						silentMode
							? 'bg-white text-ios-red border-white/40 shadow-[0_4px_18px_rgba(0,0,0,0.25)]'
							: 'bg-white/10 text-white border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
					}`}
					aria-label="Silent Mode"
				>
					{silentMode ? (
						<svg
							width="34"
							height="34"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5M17 17H3s3-2 3-9a6 6 0 0 1 .4-2.1" />
							<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
							<line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.8" />
						</svg>
					) : (
						<svg
							width="34"
							height="34"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
							<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
						</svg>
					)}
				</button>
			</div>

			{/* Focus Capsule with 3D Flip/Spin on Click */}
			<div className="perspective-500 w-full">
				<button
					onClick={handleFocusCycle}
					style={{
						transform: `perspective(600px) rotateX(${flipDegree}deg)`,
						transition:
							'transform 0.42s cubic-bezier(0.34, 1.45, 0.64, 1), background-color 0.3s ease',
					}}
					className={`w-full h-[72px] rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-between px-4 select-none ${focusInfo.bg} ${focusInfo.border} ${focusInfo.shadow} text-white active:scale-95`}
					aria-label="Cycle Focus Mode"
				>
					<div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
						<div className="w-10 h-10 rounded-full bg-white/20 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
							<FocusIcon aria-hidden="true" size={18} />
						</div>
						{/* Text container with elegant gradient fade-out / shade away mask */}
						<div
							className="flex-1 overflow-hidden whitespace-nowrap"
							style={{
								maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
								WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
							}}
						>
							<span className="text-sm font-semibold tracking-tight text-white block">
								{focusInfo.label}
							</span>
						</div>
					</div>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-white/60 flex-shrink-0 ml-1.5"
					>
						<polyline points="7 15 12 20 17 15" />
						<polyline points="7 9 12 4 17 9" />
					</svg>
				</button>
			</div>
		</div>
	);
}
