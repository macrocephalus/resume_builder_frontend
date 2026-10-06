import type { CSSProperties } from 'react'
import { cx } from '@/shared/lib/cx'
import type { Tone } from '@/shared/ui/tone'

const tones: Record<Tone, string> = {
  neutral: 'bg-line-strong',
  accent: 'bg-accent',
  wait: 'bg-wait',
  ok: 'bg-ok',
  bad: 'bg-bad',
}

type ProgressBarProps = {
  /** What is in progress, for screen readers. */
  label: string
  /** 0–100; leave it out when the end is unknown. */
  value?: number
  tone?: Tone
  /** A measurement with a value (how much of the role a CV covers), not a task in progress. */
  meter?: boolean
}

/**
 * A thin bar: filled to `value`, or sliding back and forth when the end is unknown. With `meter`
 * it is announced as a measurement instead of progress.
 */
export function ProgressBar({ label, value, tone = 'accent', meter = false }: ProgressBarProps) {
  return (
    <div
      // A native <progress> or <meter> cannot draw the sliding bar or this look the same in
      // every browser.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role={meter ? 'meter' : 'progressbar'}
      aria-label={label}
      aria-valuemin={value === undefined ? undefined : 0}
      aria-valuemax={value === undefined ? undefined : 100}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      {value === undefined ? (
        <div
          className={cx(
            'h-full w-2/5 rounded-full motion-safe:animate-indeterminate motion-reduce:w-full motion-reduce:opacity-50',
            tones[tone],
          )}
        />
      ) : (
        <div
          className={cx('h-full w-(--progress) rounded-full', tones[tone])}
          style={{ '--progress': `${Math.min(100, Math.max(0, value))}%` } as CSSProperties}
        />
      )}
    </div>
  )
}
