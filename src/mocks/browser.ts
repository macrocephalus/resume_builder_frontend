import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'

/** Starts answering `/api` in the browser. Only `main.tsx` in mock mode calls it. */
export async function startMockWorker(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledFrame: 'bypass', quiet: true })
}
