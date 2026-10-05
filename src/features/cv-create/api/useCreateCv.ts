import { cvResponseSchema, type CreateCvBody } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'

/** Creates a CV and starts its generation; the new CV is cached so its page opens at once. */
export function useCreateCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateCvBody) =>
      (await apiRequest(apiPaths.cvs, cvResponseSchema, { method: 'POST', body })).cv,
    onSuccess: (cv) => {
      queryClient.setQueryData(cvQueries.detail(cv.id).queryKey, cv)
      return queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
    },
  })
}
