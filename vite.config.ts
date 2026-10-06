import { fileURLToPath } from 'node:url'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // Serves the MSW service worker script, in mock mode only (ADR 0003).
    mode === 'mock' ? msw({ mode: 'worker-only' }) : null,
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    // A flow test waits for several screens, each up to `asyncUtilTimeout` (vitest.setup.ts):
    // the test's own limit must be longer, so a slow wait fails with its own message.
    testTimeout: 15_000,
  },
}))
