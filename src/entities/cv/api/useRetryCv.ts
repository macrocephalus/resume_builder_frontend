import { cvResponseSchema } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'

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
  })
}
