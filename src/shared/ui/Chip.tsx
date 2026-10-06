import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '@/shared/lib/cx'

const look = 'inline-flex min-h-10 max-w-full items-center rounded-full border text-sm text-ink'
/** A chip that can be clicked, while it is not picked: an outline that darkens on hover. */
const idle = 'border-line-strong bg-surface hover:border-ink'

type RemovableChipProps = ComponentProps<'span'> & {
  onRemove: () => void
  /** The remove button's name, like "Remove Kafka". */
  removeLabel: string
}

type ToggleChipProps = Omit<ComponentProps<'button'>, 'type'> & {
  /** A chip that is picked or not, like an answer option. */
  pressed: boolean
}

/** A rounded value: removable (a skill), a toggle (an answer option) or a link (a role). */
export function Chip(props: RemovableChipProps | ToggleChipProps | LinkProps) {
  if ('to' in props) {
    const { className, children, ...link } = props
    return (
      <Link
        className={cx(look, idle, 'px-3 no-underline motion-safe:transition', className)}
        {...link}
      >
        <span className="min-w-0 break-words">{children}</span>
      </Link>
    )
  }

  if ('pressed' in props) {
    const { pressed, className, ...button } = props
    return (
      <button
        type="button"
        aria-pressed={pressed}
        className={cx(
          look,
          'cursor-pointer px-3 text-left motion-safe:transition',
          pressed ? 'border-accent bg-accent-soft font-medium' : idle,
          className,
        )}
        {...button}
      />
    )
  }

  const { onRemove, removeLabel, className, children, ...span } = props
  return (
    <span className={cx(look, 'gap-0.5 border-line-strong bg-surface pl-3', className)} {...span}>
      <span className="min-w-0 break-words">{children}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </span>
  )
}
