import type { Usage } from '@cv/shared'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { formatTime, formatWait } from '@/shared/lib/format'

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

const limitOf = (error: ApiError, fallback: number): number => {
  const value = error.details.limit
  return typeof value === 'number' ? value : fallback
}

/**
 * Why a generation was refused for a limit (a create or a Retry, `429`), or `null` for any other
 * error. The hourly one says when to try again, from `Retry-After`.
 */
export function limitErrorText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  switch (error.code) {
    case 'RATE_LIMITED':
      return `You have used all ${limitOf(error, 10)} generations for this hour. Try again in ${formatWait(error.retryAfter)}.`
    case 'TOO_MANY_ACTIVE':
      return `You already have ${limitOf(error, 4)} CVs being generated. Try again when one of them is done.`
    default:
      return null
  }
}

/** Why a Retry failed. */
export const retryErrorText = (error: unknown): string => limitErrorText(error) ?? errorText(error)
