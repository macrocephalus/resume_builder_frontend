import type { Usage } from '@cv/shared'
import { formatTime } from '@/shared/lib/format'

type FormatTime = (iso: string) => string

/**
 * How many generations the hour has left. The hour is a sliding window: at `resetsAt` the oldest
 * generation leaves it, so one frees up then.
 */
export function generationsText(
  { used, limit, resetsAt }: Usage['generations'],
  time: FormatTime = formatTime,
): string {
  const count = `${used} of ${limit} generations used this hour`
  return used > 0 ? `${count} · the next one frees up at ${time(resetsAt)}` : count
}

/** Why a new CV cannot start right now, or `null` when it can. */
export function blockedText(usage: Usage, time: FormatTime = formatTime): string | null {
  const { generations, active } = usage
  if (generations.used >= generations.limit) {
    return `You have used all ${generations.limit} generations for this hour. The next one frees up at ${time(generations.resetsAt)}.`
  }
  if (active.used >= active.limit) {
    return `You already have ${active.limit} CVs being generated. Try again when one of them is done.`
  }
  return null
}
