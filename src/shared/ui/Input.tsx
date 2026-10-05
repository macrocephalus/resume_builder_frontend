import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

export type InputLook = 'field' | 'title'

const looks: Record<InputLook, string> = {
  field: 'min-h-10 w-full border-line-strong px-2.5 py-2 text-base',
  /** A heading you can edit, like the CV title: no frame until hovered or focused. */
  title:
    // Pulled out by its padding, so the text lines up with the label above it.
    '-mx-2 min-h-11 w-[calc(100%+1rem)] border-transparent px-2 py-1 font-display text-lg font-semibold hover:border-line-strong md:text-2xl',
}

/** A native input; 16 px text or more, so iOS does not zoom on focus. Works with RHF `register()`. */
export function Input({
  look = 'field',
  className,
  ...props
}: ComponentProps<'input'> & { look?: InputLook }) {
  return (
    <input
      className={cx(
        'min-w-0 rounded-sm border bg-surface text-ink focus-visible:border-accent aria-invalid:border-bad',
        looks[look],
        className,
      )}
      {...props}
    />
  )
}
