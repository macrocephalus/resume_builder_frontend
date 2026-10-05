import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/**
 * A glass bar stuck to the bottom of its container, above the phone's gesture area (the save
 * bar). Text on it stays `ink` or `accent`.
 */
export function FloatingBar({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cx(
        'sticky bottom-[calc(env(safe-area-inset-bottom)+12px)] z-10 flex flex-wrap items-center gap-2.5 rounded-md border glass px-3 py-2.5 text-sm text-ink',
        className,
      )}
      {...props}
    />
  )
}
