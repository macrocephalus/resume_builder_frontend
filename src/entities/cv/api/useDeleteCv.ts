import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiSend } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'

/** Deletes a CV in any status; it leaves the list at once. Used by the list and the CV screen. */
export function useDeleteCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiSend(apiPaths.cv(id), { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      // A list request already in flight would bring the deleted CV back.
      await queryClient.cancelQueries({ queryKey: cvQueries.list().queryKey })
      queryClient.setQueryData(cvQueries.list().queryKey, (cvs) =>
        cvs?.filter((cv) => cv.id !== id),
      )
      queryClient.removeQueries({ queryKey: cvQueries.detail(id).queryKey })
      queryClient.removeQueries({ queryKey: [...cvQueries.all(), 'statuses'] })
    },
  })
}
