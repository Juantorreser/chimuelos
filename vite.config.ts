import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    watch: {
      // More reliable reload when native FS events are missed
      usePolling: true,
      interval: 200,
    },
  },
})
