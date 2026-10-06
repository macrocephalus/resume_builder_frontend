import { cvResponseSchema } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { usageQuery } from '@/entities/cv/api/usageQuery'

/** Queues a failed CV again with its stored source. Used by the list and the CV screen. */
export function useRetryCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest(apiPaths.cvRetry(id), cvResponseSchema, { method: 'POST' })).cv,
    onSuccess: (cv) => {
      queryClient.setQueryData(cvQueries.detail(cv.id).queryKey, cv)
      return queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
    },
    // A Retry counts as a generation, and a `429` for one says the cached limits are stale. New CV
    // is not on screen, so its count is dropped rather than shown until a refetch replaces it.
    onSettled: () => queryClient.resetQueries({ queryKey: usageQuery().queryKey }),
  })
}
