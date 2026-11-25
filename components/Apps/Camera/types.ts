export type CameraMode = 'SLO-MO' | 'VIDEO' | 'PHOTO' | 'SQUARE' | 'PANO';
export type FilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cool';
export type ZoomLevel = 0.5 | 1 | 2;

export const CAMERA_MODES: CameraMode[] = ['SLO-MO', 'VIDEO', 'PHOTO', 'SQUARE', 'PANO'];
export const ZOOM_LEVELS: ZoomLevel[] = [0.5, 1, 2];

export const FILTER_LABELS: Record<FilterType, string> = {
	none: 'Original',
	grayscale: 'Noir',
	sepia: 'Warm',
	vintage: 'Vintage',
	cool: 'Cool',
};
