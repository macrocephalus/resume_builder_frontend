import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'
import type { Tone } from '@/shared/ui/tone'

const tones: Record<Tone, string> = {
  neutral: 'border-line-strong bg-bg text-ink',
  accent: 'border-accent bg-accent-soft text-accent',
  wait: 'border-wait bg-wait-soft text-wait',
  ok: 'border-ok bg-ok-soft text-ok',
  bad: 'border-bad bg-bad-soft text-bad',
}

/** A short label with a dot, coloured by tone. */
export function Pill({
  tone = 'neutral',
  className,
  children,
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-px font-mono text-xs whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
