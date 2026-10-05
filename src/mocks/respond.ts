import type { ErrorCode, ErrorResponse } from '@cv/shared'
import { HttpResponse } from 'msw'
import type { z } from 'zod'

/** The error envelope of `docs/api.md`. */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  { details = {}, headers }: { details?: Record<string, unknown>; headers?: HeadersInit } = {},
) {
  return HttpResponse.json<ErrorResponse>(
    { error: { code, message, details } },
    { status, headers },
  )
}

/** `400 VALIDATION_ERROR` with the first message per field, as the API sends it. */
export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body'
    fields[field] ??= issue.message
  }
  return errorResponse(400, 'VALIDATION_ERROR', 'The request is invalid.', { details: { fields } })
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined)
}
