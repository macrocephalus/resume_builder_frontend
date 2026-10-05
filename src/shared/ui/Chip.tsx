import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

type ChipProps = ComponentProps<'span'> &
  (
    | { onRemove?: undefined; removeLabel?: undefined }
    | {
        /** Shows a remove button. */
        onRemove: () => void
        /** The remove button's name, like "Remove Kafka". */
        removeLabel: string
      }
  )

/** A rounded value in a list, like a skill; removable. */
export function Chip({ onRemove, removeLabel, className, children, ...props }: ChipProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-10 max-w-full items-center gap-0.5 rounded-full border border-line-strong bg-surface pl-3 text-sm text-ink',
        onRemove ? 'pr-0' : 'pr-3',
        className,
      )}
      {...props}
    >
      <span className="min-w-0 break-words">{children}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}
