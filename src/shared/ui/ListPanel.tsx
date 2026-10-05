import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A solid panel of rows: a list with a thin line between its items. */
export function ListPanel({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cx(
        'flex flex-col divide-y divide-line rounded-md border border-line bg-surface text-ink',
        className,
      )}
      {...props}
    />
  )
}
