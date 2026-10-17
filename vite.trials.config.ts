import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
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
  plugins: [{
    name: 'trial-data-licence',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'licences/ARPHICPL.TXT',
        source: readFileSync(new URL('./src/trials/stroke-tracer/data/ARPHICPL.TXT', import.meta.url)),
      })
    },
    configureServer(server) {
      server.middlewares.use('/licences/ARPHICPL.TXT', (_request, response) => {
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.end(readFileSync(new URL('./src/trials/stroke-tracer/data/ARPHICPL.TXT', import.meta.url)))
      })
    },
  }],
  define: { __TRIALS_COMMIT__: JSON.stringify(commit()) },
  server: { fs: { allow: ['..'] } },
  // Output stays inside trials/ so a hosting project rooted at trials/ (see trials/vercel.json) can serve it.
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
})
