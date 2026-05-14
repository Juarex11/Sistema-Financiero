import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // /api/login  →  http://localhost:8000/api/login  ✓
        // /api/me     →  http://localhost:8000/api/me     ✓
      }
    }
  }
})