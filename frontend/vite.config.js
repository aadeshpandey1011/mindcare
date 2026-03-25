import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Suppress the 500kB chunk warning — our app has large deps (recharts, framer-motion)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large vendor libraries into separate chunks for faster loading
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor':   ['recharts'],
          'motion-vendor':  ['framer-motion'],
          'ui-vendor':      ['lucide-react'],
          'markdown-vendor':['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
})
