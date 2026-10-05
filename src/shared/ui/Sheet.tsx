import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

/**
 * A white A4 page in the PDF's font (Liberation Sans). It is at least A4 tall and grows with its
 * content. Style the text inside with `sheetText`, whose sizes follow the page width.
 */
export function Sheet({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cx('@container min-w-0', className)} {...props}>
      <div className="aspect-[210/297] border border-line-strong bg-paper p-[8.4cqw] font-paper text-[1.78cqw] leading-[1.4] break-words text-paper-ink">
        {children}
      </div>
    </div>
  )
}
