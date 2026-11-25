import type React from 'react';
import type { CameraMode, FilterType, ZoomLevel } from './types';

export function getNextFilter(current: FilterType): FilterType {
	if (current === 'none') return 'grayscale';
	if (current === 'grayscale') return 'sepia';
	if (current === 'sepia') return 'vintage';
	if (current === 'vintage') return 'cool';
	return 'none';
}

export function getCssFilter(filter: FilterType, hdrEnabled = false): string {
	const parts: string[] = [];
	if (filter === 'grayscale') {
		parts.push('grayscale(100%)');
	} else if (filter === 'sepia') {
		parts.push('sepia(85%)');
	} else if (filter === 'vintage') {
		parts.push('sepia(35%) contrast(1.08) saturate(1.15) brightness(0.96)');
	} else if (filter === 'cool') {
		parts.push('hue-rotate(15deg) saturate(1.15) brightness(1.03)');
	}
	if (hdrEnabled) {
		parts.push('contrast(1.12) saturate(1.18)');
	}
	return parts.join(' ') || 'none';
}

export function applyCanvasFilter(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	filter: FilterType,
	hdrEnabled = false
) {
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		// Indices stay in bounds by loop construction (i+2 <= length-2);
		// fallbacks only satisfy the type checker, never trigger.
		let r = data[i] ?? 0;
		let g = data[i + 1] ?? 0;
		let b = data[i + 2] ?? 0;

		if (filter === 'grayscale') {
			const avg = (r + g + b) / 3;
			r = g = b = avg;
		} else if (filter === 'sepia') {
			const nr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
			const ng = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
			const nb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
			r = nr;
			g = ng;
			b = nb;
		} else if (filter === 'vintage') {
			r = Math.min(255, r * 1.15);
			b = Math.min(255, b * 0.85);
		} else if (filter === 'cool') {
			b = Math.min(255, b * 1.18);
		}

		if (hdrEnabled) {
			// Subtle dynamic contrast + saturation lift for HDR captures.
			const contrast = 1.12;
			r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
			g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
			b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
			const luma = 0.299 * r + 0.587 * g + 0.114 * b;
			const sat = 1.16;
			r = Math.min(255, Math.max(0, luma + (r - luma) * sat));
			g = Math.min(255, Math.max(0, luma + (g - luma) * sat));
			b = Math.min(255, Math.max(0, luma + (b - luma) * sat));
		}

		data[i] = r;
		data[i + 1] = g;
		data[i + 2] = b;
	}

	ctx.putImageData(imageData, 0, 0);
}

export function getVideoStyle(
	mode: CameraMode,
	rotation: number,
	filter: FilterType = 'none',
	zoom: ZoomLevel = 1,
	hdrEnabled = false
): React.CSSProperties {
	const visualScale = zoom === 0.5 ? 0.88 : zoom;
	const style: React.CSSProperties = {
		transform: `rotate(${rotation}deg) scale(${visualScale})`,
		filter: getCssFilter(filter, hdrEnabled),
		objectFit: zoom === 0.5 ? 'contain' : 'cover',
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
