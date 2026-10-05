import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A solid content card. */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cx('rounded-md border border-line bg-surface text-ink', className)}
      {...props}
    />
  )
}
