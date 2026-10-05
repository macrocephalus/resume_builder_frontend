import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/ApiError'

type Options = {
  /** Called when a request answers `401`: the session is gone. A failed login is not that. */
  onUnauthorized: () => void
}

/** A client error will not change on a second try; a network or server error might. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient({ onUnauthorized }: Options): QueryClient {
  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401 && error.code !== 'INVALID_CREDENTIALS') {
      onUnauthorized()
    }
  }

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: { retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
