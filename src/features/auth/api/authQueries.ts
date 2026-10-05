import { userResponseSchema, type User } from '@cv/shared'
import { queryOptions } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/ApiError'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'

/** The signed-in user, or `null` for an anonymous visitor: a `401` from `me` is a normal answer. */
async function fetchMe(): Promise<User | null> {
  try {
    const { user } = await apiRequest(apiPaths.me, userResponseSchema)
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const authQueries = {
  me: () => queryOptions({ queryKey: ['me'], queryFn: fetchMe }),
}
