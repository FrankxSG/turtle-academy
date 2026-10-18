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
    // Node's native suites have dedicated commands; don't import/run them again during browser collection.
    { name: 'app', testIgnore: ['**/trials/**', '**/engine/**', '**/ui/**', 'pilot-ui.spec.ts', 'mistakes.spec.ts'], use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'allow' } },
    // Task mechanics (material sizes, checkpoint boundaries, save failures) are tested on a build whose Chinese
    // uses the synthetic shape fixture, so their exact structure stays fixed. The 'app' project tests the
    // deployed configuration with reviewed Chinese content.
    { name: 'synthetic', testMatch: 'pilot-ui.spec.ts', use: { baseURL: 'http://127.0.0.1:4175', serviceWorkers: 'allow' } },
    // Private surface exercised only on an explicitly opted-in build with synthetic records.
    { name: 'private-pack', testMatch: 'mistakes.spec.ts', use: { baseURL: 'http://127.0.0.1:4176', serviceWorkers: 'allow' } },
    // Trials build only (Issue #8): served separately so it never shares the app's origin or cache.
    { name: 'trials', testMatch: 'trials/**/*.spec.ts', use: { baseURL: 'http://127.0.0.1:4174', serviceWorkers: 'allow' } },
  ],
  webServer: [
    {
      command: 'npm run build:private && npx vite preview --mode private --outDir dist-private --host 127.0.0.1 --port 4176 --strictPort',
      url: 'http://127.0.0.1:4176', reuseExistingServer: false, timeout: 120000,
      env: { VITE_ENABLE_PRIVATE_PACK: 'true', VITE_SUPABASE_URL: 'http://127.0.0.1:4176', VITE_SUPABASE_ANON_KEY: 'synthetic-test-only' },
    },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npx vite build --outDir dist-synthetic --emptyOutDir && npx vite preview --outDir dist-synthetic --host 127.0.0.1 --port 4175 --strictPort',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        VITE_SYNTHETIC_CHINESE: '1',
        // Public synthetic endpoint, intercepted by Playwright; never a hosted project or credential.
        VITE_SUPABASE_URL: 'http://127.0.0.1:4175',
        VITE_SUPABASE_ANON_KEY: 'synthetic-test-only',
      },
    },
    {
      command: 'npm run build:trials && npm run preview:trials -- --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
})
