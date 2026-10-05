import { errorResponseSchema } from '@cv/shared'
import type { z } from 'zod'
import { ApiError } from '@/shared/api/ApiError'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: Method
  /** JSON-encoded, except a `FormData`, which is sent as multipart. */
  body?: unknown
}

const GATEWAY_STATUSES = [502, 503, 504]

async function send(path: string, { method = 'GET', body }: RequestOptions): Promise<Response> {
  let response: Response
  try {
    response = await fetch(new URL(path, window.location.origin), {
      method,
      credentials: 'same-origin',
      headers:
        body === undefined || body instanceof FormData
          ? undefined
          : { 'Content-Type': 'application/json' },
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server.')
  }
  if (!response.ok) throw await toApiError(response)
  return response
}

async function toApiError(response: Response): Promise<ApiError> {
  const json: unknown = await response.json().catch(() => undefined)
  const parsed = errorResponseSchema.safeParse(json)
  if (parsed.success) {
    const { code, message, details } = parsed.data.error
    const retryAfter = Number(response.headers.get('Retry-After'))
    return new ApiError(response.status, code, message, details, retryAfter > 0 ? retryAfter : null)
  }
  // A proxy in front of a stopped backend answers 5xx without our envelope.
  if (
    GATEWAY_STATUSES.includes(response.status) ||
    (json === undefined && response.status >= 500)
  ) {
    return new ApiError(response.status, 'NETWORK_ERROR', 'Cannot reach the server.')
  }
  return new ApiError(response.status, 'BAD_RESPONSE', 'The server sent an unexpected response.')
}

/**
 * The one `fetch` wrapper. Sends same-origin credentials, parses the response with the contract
 * schema and throws `ApiError` on a non-2xx status, malformed JSON or a failed parse.
 */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await send(path, options)
  const json: unknown = await response.json().catch(() => undefined)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new ApiError(response.status, 'BAD_RESPONSE', 'The server sent an unexpected response.')
  }
  return parsed.data
}

/** For endpoints that answer `204 No Content`. */
export async function apiSend(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options)
}
