import type { QueryClient } from '@tanstack/react-query'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { isQuestionGone } from '@/features/cv-editor/model/questionErrors'

/** The question was closed elsewhere or its target is gone: the cached CV is stale, fetch it. */
export async function refreshWhenClosed(queryClient: QueryClient, cvId: string, error: unknown) {
  if (isQuestionGone(error)) {
    await queryClient.invalidateQueries({ queryKey: cvQueries.detail(cvId).queryKey })
  }
}
