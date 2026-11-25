'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, RadioTower, Sun, Volume1, Volume2, VolumeX, type LucideIcon } from 'lucide-react';

export interface SmoothSliderProps {
	value: number;
	onChange: (value: number) => void;
	icon: string;
	label: string;
	endIcon?: string;
}

const SLIDER_ICONS: Record<string, LucideIcon> = {
	sun: Sun,
	desktop: Monitor,
	'volume-mute': VolumeX,
	'volume-down': Volume1,
	'volume-up': Volume2,
	'broadcast-tower': RadioTower,
};

export default function SmoothSlider({ value, onChange, icon, label, endIcon }: SmoothSliderProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const dragStartRef = useRef({ x: 0, initialValue: 0, width: 0 });
	const Icon = SLIDER_ICONS[icon] ?? Sun;
	const EndIcon = endIcon ? (SLIDER_ICONS[endIcon] ?? null) : null;

	// Update fill width visually when value changes externally (and not dragging)
	useEffect(() => {
		if (!isDragging && fillRef.current) {
			fillRef.current.style.width = `${value}%`;
		}
	}, [value, isDragging]);

	const handleStart = useCallback(
		(clientX: number) => {
			if (!containerRef.current) return;
			setIsDragging(true);

			const rect = containerRef.current.getBoundingClientRect();
			dragStartRef.current = {
				x: clientX,
				initialValue: value,
				width: rect.width,
			};

			const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
			const percentage = Math.round((offsetX / rect.width) * 100);

			if (fillRef.current) {
				fillRef.current.style.width = `${percentage}%`;
				fillRef.current.style.transition = 'none';
			}
			onChange(percentage);
		},
		[value, onChange]
	);

	const handleMove = useCallback(
		(clientX: number) => {
			if (!containerRef.current || !fillRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
			const percentage = Math.round((offsetX / rect.width) * 100);

			fillRef.current.style.width = `${percentage}%`;
			onChange(percentage);
		},
		[onChange]
	);

	useEffect(() => {
		if (!isDragging) return;

		const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
		const onTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			if (!touch) return;
			handleMove(touch.clientX);
		};

		const onEnd = () => {
			setIsDragging(false);
			if (fillRef.current) {
				fillRef.current.style.transition = 'width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
			}
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('touchmove', onTouchMove);
		window.addEventListener('mouseup', onEnd);
		window.addEventListener('touchend', onEnd);

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('mouseup', onEnd);
			window.removeEventListener('touchend', onEnd);
		};
	}, [isDragging, handleMove]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const step = 5;
			if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
				e.preventDefault();
				onChange(Math.min(100, Math.round(value + step)));
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
				e.preventDefault();
				onChange(Math.max(0, Math.round(value - step)));
			} else if (e.key === 'Home') {
				e.preventDefault();
				onChange(0);
			} else if (e.key === 'End') {
				e.preventDefault();
				onChange(100);
			}
		},
		[value, onChange]
	);

	const clampedValue = Math.round(value);
	const startIconOnFill = clampedValue >= 14;
	const endIconOnFill = clampedValue >= 88;

	return (
		<div className="rounded-xl bg-white/10 border border-white/10 p-2.5">
			<div className="flex items-center justify-between mb-1.5 px-0.5">
				<span className="text-[11px] font-semibold text-white/90 leading-none">{label}</span>
				<span className="text-[10px] font-medium text-white/60 tabular-nums leading-none">
					{clampedValue}%
				</span>
			</div>
			<div
				ref={containerRef}
				role="slider"
				tabIndex={0}
				aria-label={label || 'Level control'}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={clampedValue}
				className="relative h-7 w-full bg-white/15 rounded-full overflow-hidden cursor-pointer group select-none touch-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ios-blue"
				onMouseDown={e => {
					e.preventDefault();
					handleStart(e.clientX);
				}}
				onTouchStart={e => {
					const touch = e.touches[0];
					if (!touch) return;
					handleStart(touch.clientX);
				}}
				onKeyDown={handleKeyDown}
			>
				{/* Fill Bar */}
				<div
					ref={fillRef}
					className="absolute top-0 left-0 bottom-0 bg-white transition-[width] duration-200 ease-out"
					style={{ width: `${value}%` }}
				/>

				{/* Start Icon */}
				<div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
					<Icon
						aria-hidden="true"
						size={14}
						className={`transition-colors ${startIconOnFill ? 'text-neutral-800' : 'text-white/80'}`}
					/>
				</div>

				{/* Optional End Icon */}
				{EndIcon && (
					<div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
						<EndIcon
							aria-hidden="true"
							size={13}
							className={`transition-colors ${endIconOnFill ? 'text-neutral-700' : 'text-white/70'}`}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
