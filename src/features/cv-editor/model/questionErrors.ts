import type { Reply } from '@cv/shared'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'

/**
 * `409 INVALID_STATE` or `404`: a question was closed already, the part of the CV it was about is
 * gone, or the CV moved on.
 */
export const isQuestionGone = (error: unknown) =>
  error instanceof ApiError && (error.code === 'INVALID_STATE' || error.status === 404)

export const questionGoneText = 'Some questions changed — check your replies and apply again.'

export const refusedText = 'Not applied: check the marked replies and apply again.'

/** Why the batch did not go through, for the apply bar. */
export const replyErrorText = (error: unknown) => `Not applied. ${errorText(error)}`

/** `400 VALIDATION_ERROR`: the server's message for each reply it refused, by question id. */
export function refusedReplies(error: unknown, sent: readonly Reply[]): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  const { fields } = error.details
  if (typeof fields !== 'object' || fields === null) return {}
  const refused: Record<string, string> = {}
  for (const [field, message] of Object.entries(fields)) {
    const match = /^replies\.(\d+)(?:\.|$)/.exec(field)
    const questionId = match ? sent[Number(match[1])]?.questionId : undefined
    if (questionId !== undefined && typeof message === 'string') refused[questionId] ??= message
  }
  return refused
}

/** The bar's text for a failed batch: what changed, which replies to check, or why it failed. */
export function applyErrorText(error: unknown, sent: readonly Reply[]): string {
  if (isQuestionGone(error)) return questionGoneText
  if (Object.keys(refusedReplies(error, sent)).length > 0) return refusedText
  return replyErrorText(error)
}
