import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
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
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // New workers wait for deliberate user approval; never auto-reload an active task.
        skipWaiting: false,
      },
    }),
  ],
  build: { sourcemap: false },
})
