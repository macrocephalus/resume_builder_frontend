import { cvResponseSchema } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { usageQuery } from '@/features/cv-create/api/usageQuery'
import type { CreateFormInput } from '@/features/cv-create/model/createForm'

/** Creates a CV and starts its generation; the new CV is cached so its page opens at once. */
export function useCreateCv() {
  const queryClient = useQueryClient()
  return useMutation({
    // What the contract accepts: fields with a default there may be left out.
    mutationFn: async (body: CreateFormInput) =>
      (await apiRequest(apiPaths.cvs, cvResponseSchema, { method: 'POST', body })).cv,
    onSuccess: (cv) => {
      queryClient.setQueryData(cvQueries.detail(cv.id).queryKey, cv)
      return queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
    },
    // A create, or a `429` for one, changes what is left.
    onSettled: () => queryClient.invalidateQueries({ queryKey: usageQuery().queryKey }),
  })
}
