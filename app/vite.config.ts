import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    // Increase warning limit and add manual chunking for large node_modules
    chunkSizeWarningLimit: 1000, // kB
    rollupOptions: {
      output: {
        // Create a separate chunk per top-level npm package to avoid circular
        // vendor groupings and make caching more granular.
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
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      port: 5173
    },
    open: true,
  },
});
