import { API_LIMITS, type createCvBodySchema } from '@cv/shared'
import type { z } from 'zod'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { formatWait } from '@/shared/lib/format'

/** 20000 as "20 000". */
export const formatCount = (value: number) => value.toLocaleString('en-US').replaceAll(',', ' ')

/** The New CV form's values as typed, before the contract schema parses them. */
export type CreateFormInput = z.input<typeof createCvBodySchema>

/** Field names of the New CV form, which match the create body. */
export type CreateField = 'targetRole' | 'roleContext' | 'language' | 'sourceText'

/** Messages a person can act on, for the issues of the contract's `createCvBodySchema`. */
export function createIssueText(issue: z.core.$ZodRawIssue): string | undefined {
  const field = issue.path?.[0]
  const tooSmall = issue.code === 'too_small'
  switch (field) {
    case 'targetRole':
      return tooSmall
        ? `Name the role, at least ${API_LIMITS.targetRole.min} characters`
        : `Use at most ${API_LIMITS.targetRole.max} characters`
    case 'roleContext':
      return `Use at most ${formatCount(API_LIMITS.roleContext)} characters`
    case 'sourceText':
      return tooSmall
        ? `Add at least ${API_LIMITS.sourceText.min} characters about your experience`
        : `Use at most ${formatCount(API_LIMITS.sourceText.max)} characters`
    default:
      return undefined
  }
}

export const SOURCE_TEXT_MAX = API_LIMITS.sourceText.max

/** The length rule of the experience text, as the hint says it. */
export const sourceTextLimits = `${API_LIMITS.sourceText.min} to ${formatCount(API_LIMITS.sourceText.max)} characters`

/** Where a failed create is shown: next to a field, or above the submit button. */
export type CreateFailure = { field: CreateField | null; message: string }

function limit(error: ApiError, fallback: number): number {
  const value = error.details.limit
  return typeof value === 'number' ? value : fallback
}

export function createFailure(error: unknown): CreateFailure {
  if (!(error instanceof ApiError)) return { field: null, message: errorText(error) }
  switch (error.code) {
    case 'TOO_MANY_ACTIVE':
      return {
        field: null,
        message: `You already have ${limit(error, 2)} CVs being generated. Try again when one of them is done.`,
      }
    case 'RATE_LIMITED':
      return {
        field: null,
        message: `You have used all ${limit(error, 10)} generations for this hour. Try again in ${formatWait(error.retryAfter)}.`,
      }
    case 'INPUT_TOO_LARGE':
      return { field: 'sourceText', message: error.message }
    case 'VALIDATION_ERROR': {
      const fields = error.details.fields
      if (typeof fields === 'object' && fields !== null) {
        for (const field of ['targetRole', 'roleContext', 'language', 'sourceText'] as const) {
          const message: unknown = (fields as Record<string, unknown>)[field]
          if (typeof message === 'string') return { field, message }
        }
      }
    }
  }
  return { field: null, message: errorText(error) }
}
