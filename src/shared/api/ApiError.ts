import type { ErrorCode } from '@cv/shared'

/**
 * `NETWORK_ERROR`: the server could not be reached. `BAD_RESPONSE`: it answered with something
 * the contract does not allow. The other codes come from the server (`docs/api.md`).
 */
export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR' | 'BAD_RESPONSE'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: Record<string, unknown>
  /** Seconds from the `Retry-After` header of a `429`. */
  readonly retryAfter: number | null

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details: Record<string, unknown> = {},
    retryAfter: number | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.retryAfter = retryAfter
  }
}
