import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { typeforgeApi } from './src/server/apiPlugin'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load all env vars (including non-VITE_ ones) for the server-side API plugin.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // GitHub Pages serves a project site under /<repo>/. Use that base when
    // building for production; keep '/' for local dev.
    base: command === 'build' ? '/nicrep1/' : '/',
    plugins: [react(), typeforgeApi(env)],
  }
})
