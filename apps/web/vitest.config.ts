import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    exclude: ['@nodable/engine', '@nodable/sdk'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    passWithNoTests: true,
  },
})
