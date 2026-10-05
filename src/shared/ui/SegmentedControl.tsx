import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'

export type SegmentedItem<V extends string> = {
  value: V
  label: ReactNode
}

type SegmentedControlProps<V extends string> = {
  /** Names the group for screen readers. */
  label: string
  items: SegmentedItem<V>[]
  value: V
  onChange: (value: V) => void
  className?: string
}

/** Glass tabs that switch panels: one pressed button at a time. Text stays `ink` or `on-accent`. */
export function SegmentedControl<V extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: SegmentedControlProps<V>) {
  return (
    <fieldset
      className={cx('inline-flex max-w-full min-w-0 gap-1 rounded-md border glass p-1', className)}
    >
      <legend className="sr-only">{label}</legend>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
          className={cx(
            'min-h-10 cursor-pointer rounded-sm px-3.5 text-sm font-medium whitespace-nowrap motion-safe:transition',
            item.value === value ? 'bg-accent text-on-accent' : 'text-ink hover:bg-surface',
          )}
        >
          {item.label}
        </button>
      ))}
    </fieldset>
  )
}
