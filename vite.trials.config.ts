import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

// Trials-only build (Issue #8). Separate entry and output directory; no PWA
// plugin, no service worker, no public app assets. The app build
// (vite.config.ts) never includes anything from trials/ or src/trials/.
function commit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return 'unknown' }
}

export default defineConfig({
  root: 'trials',
  publicDir: false,
  define: { __TRIALS_COMMIT__: JSON.stringify(commit()) },
  server: { fs: { allow: ['..'] } },
  build: { outDir: '../dist-trials', emptyOutDir: true, sourcemap: false },
})
