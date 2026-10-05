import { cvResponseSchema, type PatchCvBody } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { storeCv } from '@/features/cv-editor/api/storeCv'

/** Saves a manual edit; the returned CV, with its next version, replaces the cached one. */
export function useSaveCv(cvId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: PatchCvBody) =>
      (await apiRequest(apiPaths.cv(cvId), cvResponseSchema, { method: 'PATCH', body })).cv,
    onSuccess: (cv) => storeCv(queryClient, cv),
  })
}
