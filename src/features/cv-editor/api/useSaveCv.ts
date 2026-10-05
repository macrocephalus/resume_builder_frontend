import { cvResponseSchema, type PatchCvBody } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'

/** Saves a manual edit; the returned CV, with its next version, replaces the cached one. */
export function useSaveCv(cvId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: PatchCvBody) =>
      (await apiRequest(apiPaths.cv(cvId), cvResponseSchema, { method: 'PATCH', body })).cv,
    onSuccess: (cv) => {
      queryClient.setQueryData(cvQueries.detail(cv.id).queryKey, cv)
      // The title, the status and the match in the list may have changed.
      void queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
    },
  })
}
