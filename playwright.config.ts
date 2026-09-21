import { defineConfig } from '@playwright/test';

// Local runs reuse the on-disk Edge build (no download needed); CI installs
// Chromium via `playwright install` and leaves this unset.
const EDGE_EXE = process.env.PLAYWRIGHT_EDGE_EXE;

export default defineConfig({
	testDir: './browser-tests',
	timeout: 60000,
	retries: 0,
	use: {
		baseURL: 'http://localhost:3100',
		launchOptions: EDGE_EXE ? { executablePath: EDGE_EXE, args: ['--no-sandbox'] } : {},
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	webServer: {
		command: 'pnpm dev --port 3100',
		url: 'http://localhost:3100',
		reuseExistingServer: true,
		timeout: 120000,
	},
});
