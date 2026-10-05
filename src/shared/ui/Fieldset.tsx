import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'

type FieldsetProps = ComponentProps<'fieldset'> & { legend: ReactNode }

/**
 * A group of fields named by a small legend, with a thin line above every group but the first
 * (an item of a list, like one job).
 */
export function Fieldset({ legend, className, children, ...props }: FieldsetProps) {
  return (
    <fieldset
      className={cx(
        'min-w-0 border-t border-line pt-4 first-of-type:border-t-0 first-of-type:pt-0',
        className,
      )}
      {...props}
    >
      {/* Floated, so the legend sits in the flow instead of on the border. */}
      <legend className="float-left mb-3 w-full font-mono text-xs text-muted">{legend}</legend>
      <div className="clear-left flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}
