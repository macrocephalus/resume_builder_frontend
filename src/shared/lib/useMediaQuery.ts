import { useSyncExternalStore } from 'react'

/** `--breakpoint-lg` of `src/index.css`: two columns from here on. */
export const WIDE = '(min-width: 980px)'

/** Whether the media query matches now; false where `matchMedia` does not exist (tests). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!window.matchMedia) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia?.(query).matches ?? false,
  )
}
