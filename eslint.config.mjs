// Flat-native config for ESLint 10. `eslint-config-next` v16 still wraps its
// (already flat) rule sets in a legacy shape that FlatCompat cannot translate,
// and `eslint-plugin-react` 7.37.5 calls the removed `context.getFilename()`,
// so both are bypassed: the Next plugin's flat `core-web-vitals` set is
// composed directly, hooks/a11y/TS sets are pinned to their previous
// severities, and the `react/*` recommended set is dropped until upstream
// ships an ESLint 10-compatible `eslint-plugin-react` (it produced zero
// findings on this codebase, so nothing relied on it).
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const config = [
	{
		ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
	},
	nextPlugin.configs['core-web-vitals'],
	...tseslint.configs.recommended,
	{
		plugins: {
			'react-hooks': reactHooks,
			'jsx-a11y': jsxA11y,
		},
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
			'jsx-a11y/aria-props': 'warn',
			'jsx-a11y/aria-proptypes': 'warn',
			'jsx-a11y/aria-unsupported-elements': 'warn',
			'jsx-a11y/role-has-required-aria-props': 'warn',
			'jsx-a11y/role-supports-aria-props': 'warn',
		},
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'prefer-const': 'warn',
			'no-console': [
				'warn',
				{
					allow: ['warn', 'error'],
				},
			],
		},
	},
];

export default config;
