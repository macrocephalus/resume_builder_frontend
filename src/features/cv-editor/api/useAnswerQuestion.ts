import { cvResponseSchema, type Answer } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { refreshWhenClosed } from '@/features/cv-editor/api/refreshWhenClosed'
import { storeCv } from '@/features/cv-editor/api/storeCv'

/** Answers a question; the returned CV has the answer in its field and may be ready. */
export function useAnswerQuestion(cvId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: Answer }) =>
      (
        await apiRequest(apiPaths.questionAnswer(cvId, questionId), cvResponseSchema, {
          method: 'POST',
          body: answer,
        })
      ).cv,
    onSuccess: (cv) => storeCv(queryClient, cv),
    onError: (error) => refreshWhenClosed(queryClient, cvId, error),
  })
}
