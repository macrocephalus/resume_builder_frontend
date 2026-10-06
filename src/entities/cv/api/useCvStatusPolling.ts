import { isInProgress, type CvStatusInfo } from '@cv/shared'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { cvQueries, fetchStatuses } from '@/entities/cv/api/cvQueries'

export const POLL_INTERVAL_MS = 3000

/** An answer older than the cached CV (a poll that was in flight during a refetch) is dropped. */
const isNewer = (info: CvStatusInfo, cached: { updatedAt: string }) =>
  info.updatedAt >= cached.updatedAt

/**
 * Brings fresh statuses into the cached CVs. While a CV is in progress its light fields are
 * patched in; once it leaves that group its detail and the list are refetched, because only then
 * do they change for real.
 *
 * The endpoint leaves out an id it no longer knows, so a CV asked for and not in the answer was
 * deleted elsewhere: it leaves the list, and its detail is dropped and asked again, which a
 * page showing it gets as Not found. Either way nothing polls it any more.
 */
function applyStatuses(
  queryClient: QueryClient,
  ids: readonly string[],
  items: CvStatusInfo[],
): void {
  const answered = new Set(items.map((info) => info.id))
  const gone = new Set(ids.filter((id) => !answered.has(id)))
  const left = items.filter((info) => !isInProgress(info.status))
  const moving = new Map(
    items.filter((info) => isInProgress(info.status)).map((info) => [info.id, info]),
  )

  for (const info of moving.values()) {
    queryClient.setQueryData(cvQueries.detail(info.id).queryKey, (cv) =>
      cv && isNewer(info, cv) ? { ...cv, ...info } : cv,
    )
  }
  queryClient.setQueryData(cvQueries.list().queryKey, (cvs) =>
    cvs
      ?.filter((cv) => !gone.has(cv.id))
      .map((cv) => {
        const info = moving.get(cv.id)
        return info && isNewer(info, cv)
          ? { ...cv, status: info.status, updatedAt: info.updatedAt }
          : cv
      }),
  )
  for (const id of gone) {
    void queryClient.resetQueries({ queryKey: cvQueries.detail(id).queryKey })
  }

  for (const info of left) {
    void queryClient.invalidateQueries({ queryKey: cvQueries.detail(info.id).queryKey })
  }
  if (left.length > 0) void queryClient.invalidateQueries({ queryKey: cvQueries.list().queryKey })
}

/**
 * Polls the light statuses endpoint every 3 s for the given CVs, which the caller passes only
 * while they are in progress; with none it stops. The full CV is never polled.
 */
export function useCvStatusPolling(ids: readonly string[]): void {
  const queryClient = useQueryClient()
  const sorted = [...ids].sort()

  useQuery({
    queryKey: cvQueries.statuses(sorted).queryKey,
    queryFn: async () => {
      const items = await fetchStatuses(sorted)
      applyStatuses(queryClient, sorted, items)
      return items
    },
    enabled: sorted.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
  })
}
