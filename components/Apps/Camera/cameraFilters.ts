import type React from 'react';
import type { CameraMode, FilterType } from './types';

export function getNextFilter(current: FilterType): FilterType {
	if (current === 'none') return 'grayscale';
	if (current === 'grayscale') return 'sepia';
	if (current === 'sepia') return 'vintage';
	if (current === 'vintage') return 'cool';
	return 'none';
}

export function applyCanvasFilter(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	filter: FilterType
) {
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		// Indices stay in bounds by loop construction (i+2 <= length-2);
		// fallbacks only satisfy the type checker, never trigger.
		const r0 = data[i] ?? 0;
		const g0 = data[i + 1] ?? 0;
		const b0 = data[i + 2] ?? 0;
		if (filter === 'grayscale') {
			const avg = (r0 + g0 + b0) / 3;
			data[i] = data[i + 1] = data[i + 2] = avg;
		} else if (filter === 'sepia') {
			data[i] = Math.min(255, r0 * 0.393 + g0 * 0.769 + b0 * 0.189);
			data[i + 1] = Math.min(255, r0 * 0.349 + g0 * 0.686 + b0 * 0.168);
			data[i + 2] = Math.min(255, r0 * 0.272 + g0 * 0.534 + b0 * 0.131);
		} else if (filter === 'vintage') {
			data[i] = Math.min(255, r0 * 1.2);
			data[i + 2] = Math.min(255, b0 * 0.8);
		} else if (filter === 'cool') {
			data[i + 2] = Math.min(255, b0 * 1.2);
		}
	}

	ctx.putImageData(imageData, 0, 0);
}

export function getVideoStyle(mode: CameraMode, rotation: number): React.CSSProperties {
	const style: React.CSSProperties = {
		transform: `rotate(${rotation}deg)`,
		objectFit: 'cover',
		width: '100%',
		height: '100%',
	};

	if (mode === 'PANO') {
		style.objectFit = 'contain';
		style.width = '100%';
		style.height = '40%';
	}

	return style;
}
