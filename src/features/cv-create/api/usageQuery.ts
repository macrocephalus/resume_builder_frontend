import { usageResponseSchema } from '@cv/shared'
import { queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { blockedText } from '@/features/cv-create/model/usage'

/** While a new CV cannot start, the limits are asked again this often, so the form unlocks. */
const BLOCKED_REFETCH_MS = 15_000

/**
 * The user's limits, for New CV. A hint before a `429`, not a gate: the form works without them,
 * so it is read with a plain query, not one a loader waits for.
 */
export const usageQuery = () =>
  queryOptions({
    queryKey: ['usage'],
    queryFn: () => apiRequest(apiPaths.usage, usageResponseSchema),
    refetchInterval: (query) =>
      query.state.data && blockedText(query.state.data) ? BLOCKED_REFETCH_MS : false,
  })
