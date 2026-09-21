import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		// Node keeps utility/store tests fast; DOM tests opt in per file via
		// `@vitest-environment jsdom` (requires the jsdom package).
		// Note: TSX component modules (e.g. utils/appComponents.tsx) cannot
		// currently be imported here; keep testable predicates JSX-free.
		environment: 'node',
		// Playwright specs live in browser-tests/ and run via `playwright test`.
		exclude: ['**/node_modules/**', '**/browser-tests/**', '**/test-results/**'],
	},
});
