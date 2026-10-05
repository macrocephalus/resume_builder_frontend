import { ApiError } from '@/shared/api/ApiError'

const GENERIC = 'Something went wrong. Please try again.'

/**
 * The fallback text for an error. A feature that knows a code gives its own text first; this
 * knows no server codes: only an unreachable server, a broken response and a 5xx.
 */
export function errorText(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC
  if (error.code === 'NETWORK_ERROR')
    return 'Cannot reach the server. Check your connection and try again.'
  // A broken response or a server failure has no message meant for the user.
  if (error.code === 'BAD_RESPONSE' || error.status >= 500) return GENERIC
  return error.message || GENERIC
}
