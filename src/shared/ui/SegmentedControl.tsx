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
  /** Full width, the buttons sharing it equally (the phone's panel switch). */
  block?: boolean
  className?: string
}

/** Glass tabs that switch panels: one pressed button at a time. Text stays `ink` or `on-accent`. */
export function SegmentedControl<V extends string>({
  label,
  items,
  value,
  onChange,
  block = false,
  className,
}: SegmentedControlProps<V>) {
  return (
    <fieldset
      className={cx(
        'max-w-full min-w-0 gap-1 rounded-md border glass p-1',
        block ? 'flex w-full' : 'inline-flex',
        className,
      )}
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
            block && 'flex-1',
          )}
        >
          {item.label}
        </button>
      ))}
    </fieldset>
  )
}
