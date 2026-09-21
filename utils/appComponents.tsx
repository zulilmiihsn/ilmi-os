/**
 * Centralized app component mapping with dynamic imports
 * Prevents duplication between Desktop/Window and Mobile/HomeScreen
 * Uses dynamic imports for code splitting
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { AppComponentName } from '../types';
import { isValidComponentName } from './componentNames';

export type { AppComponentName };
export { isValidComponentName };

// Loading component for dynamic imports (Clean native-like splash)
const LoadingComponent = () => <div className="w-full h-full bg-white dark:bg-black" />;

// Dynamic imports untuk code splitting
const Calculator = dynamic(() => import('../components/Apps/Calculator'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Notes = dynamic(() => import('../components/Apps/Notes/Notes'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Finder = dynamic(() => import('../components/Apps/Finder'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Files = dynamic(() => import('../components/Apps/Files/Files'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Terminal = dynamic(() => import('../components/Apps/Terminal'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Settings = dynamic(() => import('../components/Apps/Settings'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Photos = dynamic(() => import('../components/Apps/Photos/Photos'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Clock = dynamic(() => import('../components/Apps/Clock/Clock'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Camera = dynamic(() => import('../components/Apps/Camera'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Calendar = dynamic(() => import('../components/Apps/Calendar'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Mail = dynamic(() => import('../components/Apps/Mail/Mail'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

const Maps = dynamic(() => import('../components/Apps/Maps'), {
	loading: () => <LoadingComponent />,
	ssr: false,
});

export const APP_COMPONENT_MAP: Record<Exclude<AppComponentName, 'placeholder'>, ComponentType> = {
	Calculator,
	Notes,
	Finder,
	Files,
	Terminal,
	Settings,
	Photos,
	Clock,
	Camera,
	Calendar,
	Mail,
	Maps,
} as const;

/**
 * Get component by name with dynamic loading
 * Type-safe: unknown / placeholder names return null instead of crashing.
 */
export function getAppComponent(componentName: AppComponentName | string): ComponentType | null {
	if (!isValidComponentName(componentName)) return null;
	return APP_COMPONENT_MAP[componentName];
}
