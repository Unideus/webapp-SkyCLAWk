import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  base: '/auspicious/',
  plugins: [wasm(), topLevelAwait()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@fusionstrings/swiss-eph'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5177,
  },
})