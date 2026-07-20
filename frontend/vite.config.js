import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Dev server proxies /api and /socket.io straight to the NestJS backend.
// Auth is a bearer session token (not a cookie), so this is just here to
// avoid CORS/port mismatches between the Vite dev server and the API.
export default defineConfig({
  plugins: [
    react(),
    // Generates + registers a service worker with a fetch handler at build
    // time. Required for Chrome installability / Play Store TWA wrapping
    // (Bubblewrap, PWABuilder) — a manifest alone isn't enough.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // we already ship a hand-written public/manifest.json
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Don't cache API/socket calls — session-token auth + live game
        // state should always hit the network, not a stale SW cache.
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
