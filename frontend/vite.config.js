import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '2027efcb6252.ngrok-free.app',
      '.ngrok-free.app', // Permite cualquier subdominio de ngrok
    ]
  }
})
