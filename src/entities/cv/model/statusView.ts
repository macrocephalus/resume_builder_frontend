import type { CvStatus } from '@cv/shared'
import type { Tone } from '@/shared/ui/tone'

/** What a user can do with a CV from the list or its screen, besides editing. */
export type CvAction = 'open' | 'watch' | 'retry' | 'delete'

export type StatusView = {
  label: string
  tone: Tone
  actions: readonly CvAction[]
}

/**
 * Everything the UI shows for a status comes from the status string (docs/cv-statuses.md).
 * Nothing infers a status from other fields.
 */
export const statusView: Record<CvStatus, StatusView> = {
  queued: { label: 'In queue', tone: 'neutral', actions: ['watch', 'delete'] },
  generating: { label: 'Generating', tone: 'accent', actions: ['watch', 'delete'] },
  retrying: { label: 'Retrying', tone: 'wait', actions: ['watch', 'delete'] },
  failed: { label: 'Failed', tone: 'bad', actions: ['retry', 'delete'] },
  needs_input: { label: 'Needs your answers', tone: 'wait', actions: ['open', 'delete'] },
  ready: { label: 'Ready', tone: 'ok', actions: ['open', 'delete'] },
}
