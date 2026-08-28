import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

const isElectronBuild = process.env.ELECTRON === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    sourcemap: false,
    minify: false,
    chunkSizeWarningLimit: 1000, // kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          const m = id.match(/node_modules\/(?:@[^\/]+\/[^\/]+|[^\/]+)/)
          if (m) {
            const pkg = m[0].replace(/^node_modules\//, '')
            const name = pkg.replace('@', '').replace('/', '-')
            return `vendor-${name}`
          }
        }
      }
    }
  },
  plugins: [
    react(),
    ...(!isElectronBuild ? [VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'manifest.json'],
      manifest: {
        name: 'نظام الجودة الشاملة للأدوية',
        short_name: 'TPQM',
        description: 'Total Pharmaceutical Quality Management System',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(isElectronBuild ? {
        "./components/PWAUpdatePrompt": path.resolve(__dirname, "./src/components/PWAUpdatePrompt.electron.tsx"),
        "@/components/PWAUpdatePrompt": path.resolve(__dirname, "./src/components/PWAUpdatePrompt.electron.tsx"),
      } : {}),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: { port: 5173 },
    open: true,
  },
});
