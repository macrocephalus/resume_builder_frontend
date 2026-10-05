import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A native select: the phone's own picker and full a11y. Works with RHF `register()`. */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cx(
        'min-h-10 w-full min-w-0 rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-base text-ink focus-visible:border-accent aria-invalid:border-bad',
        className,
      )}
      {...props}
    />
  )
}
