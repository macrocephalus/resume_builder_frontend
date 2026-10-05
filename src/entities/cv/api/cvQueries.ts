import { cvListResponseSchema, cvResponseSchema, cvStatusesResponseSchema } from '@cv/shared'
import { queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'

/** The light status of each CV, for polling. */
export async function fetchStatuses(ids: readonly string[]) {
  return (await apiRequest(apiPaths.cvStatuses(ids), cvStatusesResponseSchema)).items
}

export const cvQueries = {
  all: () => ['cvs'] as const,
  list: () =>
    queryOptions({
      queryKey: [...cvQueries.all(), 'list'],
      queryFn: async () => (await apiRequest(apiPaths.cvs, cvListResponseSchema)).items,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...cvQueries.all(), 'detail', id],
      queryFn: async () => (await apiRequest(apiPaths.cv(id), cvResponseSchema)).cv,
      // The editor mounts a fresh form for each new version, so a version fetched behind the
      // user's back (on focus or reconnect) would drop unsaved edits. A new version comes from
      // this tab's own save, polling, or an explicit "Reload latest" after a conflict.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  statuses: (ids: readonly string[]) =>
    queryOptions({
      queryKey: [...cvQueries.all(), 'statuses', ids],
      queryFn: () => fetchStatuses(ids),
    }),
}
