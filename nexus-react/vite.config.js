import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Em desenvolvimento, redireciona chamadas /api para o backend Node.js
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Build vai para a pasta public do backend
  build: {
    outDir: '../nexus-final/public',
    emptyOutDir: true,
  },
})
