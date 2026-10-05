import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A frosted card on the glass layer (the auth card). Text on it stays `ink` or `accent`. */
export function GlassCard({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cx('flex flex-col gap-4 rounded-md border glass p-6 text-ink', className)}
      {...props}
    />
  )
}
