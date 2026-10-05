import { cleanup, render } from '@testing-library/react'
import { App } from '@/app/App'
import { createApp } from '@/app/createApp'

let current: ReturnType<typeof createApp> | null = null

/**
 * The whole app at `path`: real router, providers and API client, answered by the mock handlers.
 * Calling it again in one test is a page reload: the previous app is gone, the mock data stays.
 */
export function renderApp(path = '/') {
  if (current) {
    cleanup()
    current.router.dispose()
  }
  window.history.replaceState(null, '', path)
  const app = createApp()
  // A failed request fails at once, so a test does not wait for retries.
  app.queryClient.setDefaultOptions({ queries: { retry: false }, mutations: { retry: false } })
  render(<App queryClient={app.queryClient} router={app.router} />)
  current = app
  return app
}
