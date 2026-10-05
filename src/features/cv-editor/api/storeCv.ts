import type { Cv } from '@cv/shared'
import type { QueryClient } from '@tanstack/react-query'
import { cvQueries } from '@/entities/cv/api/cvQueries'

/** A mutation returned the whole CV: it replaces the cached one, and the list catches up. */
export function storeCv(queryClient: QueryClient, cv: Cv): void {
  queryClient.setQueryData(cvQueries.detail(cv.id).queryKey, cv)
  // The title, the status, the open questions and the match in the list may have changed.
  void queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
}
