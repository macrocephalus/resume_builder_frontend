import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A wrapping line of small secondary facts: a status, a count, a date. */
export function MetaLine({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] text-muted',
        className,
      )}
      {...props}
    />
  )
}
