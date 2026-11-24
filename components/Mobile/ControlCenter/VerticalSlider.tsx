'use client';

import React, { useState, useRef, useCallback } from 'react';

// Vertical Liquid Glass Capsule Slider (iOS 26 Style)
interface VerticalSliderProps {
	value: number;
	onChange: (val: number) => void;
	icon: 'sun' | 'speaker';
	label: string;
}

export default function VerticalSlider({ value, onChange, icon, label }: VerticalSliderProps) {
	const sliderRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const updateFromEvent = useCallback(
		(clientY: number) => {
			if (!sliderRef.current) return;
			const rect = sliderRef.current.getBoundingClientRect();
			const offsetY = clientY - rect.top;
			const clamped = Math.max(0, Math.min(rect.height, offsetY));
			const percentage = Math.round(100 - (clamped / rect.height) * 100);
			onChange(percentage);
		},
		[onChange]
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}
		setIsDragging(true);
		updateFromEvent(e.clientY);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		e.stopPropagation();
		updateFromEvent(e.clientY);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		e.stopPropagation();
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {}
		setIsDragging(false);
	};

	const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const step = 5;
		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			e.preventDefault();
			e.stopPropagation();
			onChange(Math.min(100, Math.round(value + step)));
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			e.preventDefault();
			e.stopPropagation();
			onChange(Math.max(0, Math.round(value - step)));
		} else if (e.key === 'Home') {
			e.preventDefault();
			e.stopPropagation();
			onChange(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			e.stopPropagation();
			onChange(100);
		}
	};

	return (
		<div
			ref={sliderRef}
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-orientation="vertical"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(value)}
			className="ios-vertical-slider relative w-full h-[156px] bg-white/10 rounded-full overflow-hidden cursor-pointer touch-none select-none border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.25)] flex flex-col justify-end active:scale-[0.97] transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerCancel}
			onTouchStart={e => e.stopPropagation()}
			onTouchMove={e => e.stopPropagation()}
			onTouchEnd={e => e.stopPropagation()}
			onKeyDown={handleSliderKeyDown}
		>
			{/* Liquid Fill Level */}
			<div
				className="w-full bg-white transition-[height] duration-75 ease-out rounded-b-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"
				style={{ height: `${value}%` }}
			/>

			{/* Icon Centered at Bottom */}
			<div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
				{icon === 'sun' ? (
					<svg
						width="30"
						height="30"
						viewBox="0 0 24 24"
						fill="currentColor"
						className={`transition-colors drop-shadow-sm ${value > 45 ? 'text-ios-yellow' : 'text-white'}`}
					>
						<circle cx="12" cy="12" r="4.5" />
						<path
							d="M12 1.5v2.5M12 20v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M1.5 12H4M20 12h2.5M6.3 17.7l-1.8 1.8M19.5 4.5l-1.8 1.8"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
						/>
					</svg>
				) : (
					<svg
						width="30"
						height="30"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={`transition-colors drop-shadow-sm ${value > 0 ? 'text-black' : 'text-white'}`}
					>
						{value === 0 ? (
							<>
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
								<line x1="23" y1="9" x2="17" y2="15" />
								<line x1="17" y1="9" x2="23" y2="15" />
							</>
						) : (
							<>
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
								<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
								{value > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
							</>
						)}
					</svg>
				)}
			</div>
			<span className="sr-only">{label}</span>
		</div>
	);
}
