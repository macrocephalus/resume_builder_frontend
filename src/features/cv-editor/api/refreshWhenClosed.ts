import type { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/ApiError'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { forgetStoredReplies } from '@/entities/cv/model/storedReplies'
import { isQuestionGone } from '@/features/cv-editor/model/questionErrors'

/**
 * A question was closed elsewhere, its target is gone, or the CV itself is: the cached CV is
 * stale, so it is fetched again. When that fetch finds no CV either (deleted in another tab or
 * device), its detail is dropped and asked again, as polling does, so the screen shows Not found;
 * the replies kept for it go too.
 */
export async function refreshWhenClosed(queryClient: QueryClient, cvId: string, error: unknown) {
  if (!isQuestionGone(error)) return
  const { queryKey } = cvQueries.detail(cvId)
  await queryClient.invalidateQueries({ queryKey })
  const state = queryClient.getQueryState(queryKey)
  if (state?.status === 'error' && state.error instanceof ApiError && state.error.status === 404) {
    await queryClient.resetQueries({ queryKey })
    forgetStoredReplies(cvId)
  }
}
