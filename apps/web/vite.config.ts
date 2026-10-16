import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env['BASE_PATH'] ?? '/',
  plugins: [svelte()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
})
