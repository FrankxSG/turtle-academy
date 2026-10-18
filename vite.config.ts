import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const requested = env.VITE_ENABLE_PRIVATE_PACK === 'true'
  // A public/hosted build cannot acquire private code through an inherited environment variable.
  if (requested && mode !== 'private') throw new Error('Private packs require explicit --mode private')
  if (mode === 'private' && !requested) throw new Error('Private mode requires VITE_ENABLE_PRIVATE_PACK=true')
  return {
  define: { __PRIVATE_PACK_ENABLED__: JSON.stringify(requested && mode === 'private') },
  plugins: [
    ...(mode === 'private' ? [] : [{
      name: 'public-pack-boundary',
      generateBundle(_options: unknown, bundle: Record<string, { type: string; modules?: Record<string, unknown> }>) {
        for (const output of Object.values(bundle)) {
          if (output.type === 'chunk' && Object.keys(output.modules ?? {}).some((id) => /\/src\/(mistakes\/|parent\/Mistakes\.tsx)/.test(id.replaceAll('\\', '/'))))
            throw new Error('Private-pack module reached a public build')
        }
      },
    }]),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['turtle.svg', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'Turtle Academy',
        short_name: 'Turtle Academy',
        description: 'Gentle learning adventures in a world of discovery.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#faf7ef',
        theme_color: '#174d43',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Reviewed Chinese content is a separate chunk of about 1 MB; keep it in the offline precache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // New workers wait for deliberate user approval; never auto-reload an active task.
        skipWaiting: false,
      },
    }),
  ],
  build: { sourcemap: false, outDir: mode === 'private' ? 'dist-private' : 'dist' },
  }
})
