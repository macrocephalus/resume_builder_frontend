import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiSend } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { cvQueries } from '@/entities/cv/api/cvQueries'

type Options = {
  /**
   * Called once the CV is gone and before the cache drops it, so a screen that shows this CV can
   * leave first instead of refetching it.
   */
  onDeleted?: () => Promise<void> | void
}

/** Deletes a CV in any status; it leaves the list at once. Used by the list and the CV screen. */
export function useDeleteCv({ onDeleted }: Options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiSend(apiPaths.cv(id), { method: 'DELETE' }),
    onSuccess: async (_, id) => {
      // A list request already in flight would bring the deleted CV back.
      await queryClient.cancelQueries({ queryKey: cvQueries.list().queryKey })
      queryClient.setQueryData(cvQueries.list().queryKey, (cvs) =>
        cvs?.filter((cv) => cv.id !== id),
      )
      await onDeleted?.()
      queryClient.removeQueries({ queryKey: cvQueries.detail(id).queryKey })
      queryClient.removeQueries({ queryKey: [...cvQueries.all(), 'statuses'] })
    },
  })
}
