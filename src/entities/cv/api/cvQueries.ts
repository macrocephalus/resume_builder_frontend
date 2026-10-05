import { cvListResponseSchema, cvResponseSchema, cvStatusesResponseSchema } from '@cv/shared'
import { queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'

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
    }),
  statuses: (ids: readonly string[]) =>
    queryOptions({
      queryKey: [...cvQueries.all(), 'statuses', ids],
      queryFn: async () =>
        (await apiRequest(apiPaths.cvStatuses(ids), cvStatusesResponseSchema)).items,
    }),
}
