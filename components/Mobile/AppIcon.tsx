'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import type { AppMetadata } from '../../types';

interface AppIconProps {
	app: AppMetadata;
	onClick?: () => void;
	isDock?: boolean;
	isDragging?: boolean;
	dragPosition?: { x: number; y: number } | null;
	onTouchStart?: (e: React.TouchEvent) => void;
	onTouchMove?: (e: React.TouchEvent) => void;
	onTouchEnd?: (e: React.TouchEvent) => void;
}

function AppIcon({
	app,
	onClick,
	isDock = false,
	isDragging = false,
	dragPosition = null,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
}: AppIconProps) {
	const [isPressed, setIsPressed] = useState(false);
	const isSvgIcon = app.icon.startsWith('/');

	const _iconStyle = isDragging && dragPosition
		? {
			position: 'fixed' as const,
			left: `${dragPosition.x}px`,
			top: `${dragPosition.y}px`,
			transform: 'translate(-50%, -50%) scale(1.15)',
			zIndex: 1000,
			pointerEvents: 'none' as const,
			opacity: 0.9,
			transition: 'none',
		}
		: {};

	return (
		<>
			<button
				data-app-id={app.id}
				className={`ios-icon w-full flex flex-col items-center justify-center transition-all ${isPressed && !isDragging ? 'ios-tap-animation scale-90' : ''
					} ${isDragging ? 'ios-dragging' : ''} ${!isDragging ? 'ios-icon-swapping' : ''}`}
				onClick={onClick}
				onMouseDown={() => !isDragging && setIsPressed(true)}
				onMouseUp={() => setIsPressed(false)}
				onMouseLeave={() => setIsPressed(false)}
				onTouchStart={(e) => {
					if (onTouchStart) {
						onTouchStart(e);
					} else {
						setIsPressed(true);
					}
				}}
				onTouchMove={(e) => {
					if (onTouchMove) {
						onTouchMove(e);
					}
				}}
				onTouchEnd={(e) => {
					if (onTouchEnd) {
						onTouchEnd(e);
					}
					setIsPressed(false);
				}}
				aria-label={app.name}
				style={isDragging && dragPosition ? { opacity: 0.4 } : {}}
			>
				{isDock ? (
					isSvgIcon ? (
						<Image
							src={app.icon}
							alt={app.name}
							width={64}
							height={64}
							className="w-16 h-16 drop-shadow-lg"
							style={{ width: 'auto', height: 'auto' }}
							unoptimized
						/>
					) : (
						<div className="ios-app-box w-16 h-16 flex items-center justify-center">
							<i className={`fas ${app.icon} text-3xl text-white drop-shadow-lg`}></i>
						</div>
					)
				) : (
					<>
						{isSvgIcon ? (
							<>
								<Image
									src={app.icon}
									alt={app.name}
									width={64}
									height={64}
									className="w-full aspect-square mb-1.5 max-w-[64px] mx-auto drop-shadow-lg"
									style={{ width: '100%', height: 'auto' }}
									unoptimized
								/>
								<span className="text-xs font-medium text-white drop-shadow-md text-center leading-tight w-full">
									{app.name}
								</span>
							</>
						) : (
							<>
								<div className="ios-app-box w-full aspect-square flex items-center justify-center mb-1.5 max-w-[64px] mx-auto">
									<i className={`fas ${app.icon} text-3xl text-white drop-shadow-lg`}></i>
								</div>
								<span className="text-xs font-medium text-white drop-shadow-md text-center leading-tight w-full">
									{app.name}
								</span>
							</>
						)}
					</>
				)}
			</button>
		</>
	);
}

export default memo(AppIcon);


