import { cvResponseSchema } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { refreshWhenClosed } from '@/features/cv-editor/api/refreshWhenClosed'
import { storeCv } from '@/features/cv-editor/api/storeCv'

/** Skips a question; its field stays as it is, and the CV may become ready. */
export function useSkipQuestion(cvId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (questionId: string) =>
      (
        await apiRequest(apiPaths.questionSkip(cvId, questionId), cvResponseSchema, {
          method: 'POST',
        })
      ).cv,
    onSuccess: (cv) => storeCv(queryClient, cv),
    onError: (error) => refreshWhenClosed(queryClient, cvId, error),
  })
}
