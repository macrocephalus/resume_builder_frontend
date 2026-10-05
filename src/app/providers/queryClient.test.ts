import { describe, expect, test, vi } from 'vitest'
import { createQueryClient } from '@/app/providers/queryClient'
import { ApiError } from '@/shared/api/ApiError'

const failWith = (error: ApiError) => () => Promise.reject(error)

describe('createQueryClient', () => {
  test('reports a 401 from a query', async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })

    await client
      .fetchQuery({
        queryKey: ['x'],
        queryFn: failWith(new ApiError(401, 'UNAUTHORIZED', 'No session')),
      })
      .catch(() => {})

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  test('reports a 401 from a mutation', async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })

    await client
      .getMutationCache()
      .build(client, { mutationFn: failWith(new ApiError(401, 'UNAUTHORIZED', 'No session')) })
      .execute(undefined)
      .catch(() => {})

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  test('ignores a failed login, which is a 401 of another kind', async () => {
    const onUnauthorized = vi.fn()
    const client = createQueryClient({ onUnauthorized })

    await client
      .getMutationCache()
      .build(client, { mutationFn: failWith(new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong')) })
      .execute(undefined)
      .catch(() => {})

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
