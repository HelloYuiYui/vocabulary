import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; override with BASE_PATH for other hosts.
  base: process.env.BASE_PATH ?? '/cahier-de-vocabulaire/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
