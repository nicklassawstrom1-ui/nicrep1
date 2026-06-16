import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { typeforgeApi } from './src/server/apiPlugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones) for the server-side API plugin.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), typeforgeApi(env)],
  }
})
