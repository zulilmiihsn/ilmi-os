import type { AppComponentName } from '../types';

/** Components with a real implementation (placeholder excluded). No JSX here so it stays unit-testable. */
export const REGISTERED_COMPONENT_NAMES = [
	'Calculator',
	'Notes',
	'Finder',
	'Files',
	'Terminal',
	'Settings',
	'Photos',
	'Clock',
	'Camera',
	'Calendar',
	'Mail',
	'Maps',
] as const satisfies readonly Exclude<AppComponentName, 'placeholder'>[];

const REGISTERED_NAMES = new Set<string>(REGISTERED_COMPONENT_NAMES);

/**
 * Own-property/set membership check: `in` on the component map would also
 * accept inherited names like "toString".
 */
export function isValidComponentName(
	name: string
): name is Exclude<AppComponentName, 'placeholder'> {
	return REGISTERED_NAMES.has(name);
}
