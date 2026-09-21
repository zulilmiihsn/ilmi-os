export type Platform = 'ios' | 'macos';
export type SupportedPlatform = Platform | 'both';

/** Registry of real, implemented app components. Placeholder apps use 'placeholder'. */
export type AppComponentName =
	| 'Calculator'
	| 'Notes'
	| 'Finder'
	| 'Files'
	| 'Terminal'
	| 'Settings'
	| 'Photos'
	| 'Clock'
	| 'Camera'
	| 'Calendar'
	| 'Mail'
	| 'Maps'
	| 'placeholder';

export interface DeviceInfo {
	platform: Platform;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	screenWidth: number;
	screenHeight: number;
	hasTouch: boolean;
}

export interface WindowState {
	id: string;
	title: string;
	appId: string;
	x: number;
	y: number;
	width: number;
	height: number;
	isMaximized: boolean;
	isMinimized: boolean;
	zIndex: number;
	isFocused: boolean;
	originRect?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface FileSystemItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	path: string;
	parentId: string | null;
	children?: FileSystemItem[];
	content?: string;
	size?: number;
	createdAt: number;
	modifiedAt: number;
}

export interface AppMetadata {
	id: string;
	name: string;
	icon: string;
	component: AppComponentName;
	platform: SupportedPlatform;
	showInDock?: boolean;
	showOnDesktop?: boolean;
}

export function isIosApp(app: AppMetadata): boolean {
	return app.platform === 'ios' || app.platform === 'both';
}

export function isMacosApp(app: AppMetadata): boolean {
	return app.platform === 'macos' || app.platform === 'both';
}
