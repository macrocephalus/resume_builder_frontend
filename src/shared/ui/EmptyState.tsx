import type { ReactNode } from 'react'
import { Panel } from '@/shared/ui/Panel'

type EmptyStateProps = {
  title: string
  /** What to do next. */
  children: ReactNode
  action?: ReactNode
}

/** A view with nothing to show yet, saying what to do next. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <Panel className="flex flex-col items-start gap-3 px-4 py-7">
      <h2>{title}</h2>
      <p className="text-muted">{children}</p>
      {action}
    </Panel>
  )
}
