import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import type { Tone } from '@/shared/ui/tone'

const tones: Record<Tone, string> = {
  neutral: 'border-line bg-surface',
  accent: 'border-accent bg-accent-soft',
  wait: 'border-wait bg-wait-soft',
  ok: 'border-ok bg-ok-soft',
  bad: 'border-bad bg-bad-soft',
}

type NoticeProps = ComponentProps<'div'> & {
  tone?: Tone
  /** A button or link next to the text. */
  action?: ReactNode
}

/** A message in the flow of the page. Pass `role="alert"` when it reports a failure. */
export function Notice({ tone = 'neutral', action, className, children, ...props }: NoticeProps) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-3 rounded-sm border px-3 py-2.5 text-sm text-ink',
        tones[tone],
        className,
      )}
      {...props}
    >
      <div className="min-w-0 grow">{children}</div>
      {action}
    </div>
  )
}
