import { cvResponseSchema, repliesBodySchema, type Reply } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { refreshWhenClosed } from '@/features/cv-editor/api/refreshWhenClosed'
import { storeCv } from '@/features/cv-editor/api/storeCv'

/**
 * Applies a batch of answers and skips in one request; the returned CV has the answers in their
 * targets, worded by the server where it does that, and may be ready. The request can take a
 * while (the server words the answers): the client sets no timeout of its own.
 */
export function useApplyReplies(cvId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (replies: Reply[]) => {
      // Checked here as the server checks it, so a bad batch never leaves the browser.
      const body = repliesBodySchema.parse({ replies })
      return (
        await apiRequest(apiPaths.cvReplies(cvId), cvResponseSchema, { method: 'POST', body })
      ).cv
    },
    onSuccess: (cv) => storeCv(queryClient, cv),
    onError: (error) => refreshWhenClosed(queryClient, cvId, error),
  })
}
