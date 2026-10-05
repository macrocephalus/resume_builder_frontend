import { API_LIMITS } from '@cv/shared'
import type { z } from 'zod'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'

const { min, max } = API_LIMITS.password

/**
 * Messages a person can act on, for the issues of the contract's `credentialsSchema`. The form
 * validates with that schema itself, so its rules cannot drift from the API.
 */
export function credentialsIssueText(issue: z.core.$ZodRawIssue): string | undefined {
  if (issue.path?.[0] === 'email') return 'Enter a valid email, like name@example.com'
  if (issue.path?.[0] === 'password') {
    if (issue.code === 'too_small') return `Use at least ${min} characters`
    if (issue.code === 'too_big') return `Use at most ${max} characters`
  }
  return undefined
}

/** Where a failed sign-up or login is shown: next to a field, or above the form. */
export type AuthFailure = { field: 'email' | 'password' | null; message: string }

function minutes(seconds: number | null): string {
  const count = Math.max(1, Math.ceil((seconds ?? 60) / 60))
  return count === 1 ? '1 minute' : `${count} minutes`
}

/** The server's message for one field of a `400 VALIDATION_ERROR`, if it sent one. */
function fieldMessage(error: ApiError, field: 'email' | 'password'): string | undefined {
  const fields = error.details.fields
  if (typeof fields !== 'object' || fields === null || !(field in fields)) return undefined
  const message: unknown = (fields as Record<string, unknown>)[field]
  return typeof message === 'string' ? message : undefined
}

export function authFailure(error: unknown): AuthFailure {
  if (!(error instanceof ApiError)) return { field: null, message: errorText(error) }
  switch (error.code) {
    case 'EMAIL_TAKEN':
      return {
        field: 'email',
        message: 'An account with this email already exists. Log in instead.',
      }
    case 'INVALID_CREDENTIALS':
      // One message for an unknown email and a wrong password, so emails are not revealed.
      return { field: null, message: 'Wrong email or password.' }
    case 'RATE_LIMITED':
      return {
        field: null,
        message: `Too many attempts. Try again in ${minutes(error.retryAfter)}.`,
      }
    case 'VALIDATION_ERROR':
      for (const field of ['email', 'password'] as const) {
        const message = fieldMessage(error, field)
        if (message) return { field, message }
      }
  }
  return { field: null, message: errorText(error) }
}
