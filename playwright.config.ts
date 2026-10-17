import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // In CI also emit GitHub annotations so failing test names and errors are visible on the check run.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { browserName: 'chromium' },
  projects: [
    { name: 'app', testIgnore: '**/trials/**', use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'allow' } },
    // Trials build only (Issue #8): served separately so it never shares the app's origin or cache.
    { name: 'trials', testMatch: 'trials/**/*.spec.ts', use: { baseURL: 'http://127.0.0.1:4174', serviceWorkers: 'allow' } },
  ],
  webServer: [
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npm run build:trials && npm run preview:trials -- --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
})
