import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves a project site under /<repo>/. Use that base when
  // building for production; keep '/' for local dev.
  base: command === 'build' ? '/nicrep1/' : '/',
  plugins: [react()],
}))
