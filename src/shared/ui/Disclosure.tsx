import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'

type DisclosureProps = ComponentProps<'details'> & { summary: ReactNode }

/** A solid panel that opens on a click: a native `<details>` (the "Answered (N)" list). */
export function Disclosure({ summary, className, children, ...props }: DisclosureProps) {
  return (
    <details
      className={cx('rounded-md border border-line bg-surface text-ink', className)}
      {...props}
    >
      <summary className="flex min-h-10 cursor-pointer items-center px-4 py-2.5 font-medium">
        {summary}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </details>
  )
}
