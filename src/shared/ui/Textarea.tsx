import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/** A native text area; 16 px text so iOS does not zoom on focus. Works with RHF `register()`. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cx(
        'min-h-10 w-full min-w-0 resize-y rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-base leading-[1.45] text-ink focus-visible:border-accent aria-invalid:border-bad',
        className,
      )}
      {...props}
    />
  )
}
