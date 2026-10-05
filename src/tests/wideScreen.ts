import { onTestFinished, vi } from 'vitest'

/** The test runs as on a screen of 980 px or more: jsdom has no `matchMedia` of its own. */
export function wideScreen() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  onTestFinished(() => {
    vi.unstubAllGlobals()
  })
}
