import { createAppRouter } from '@/app/router'
import { createQueryClient } from '@/app/providers/queryClient'
import { authQueries } from '@/features/auth/api/authQueries'

/**
 * A fresh query client and router, wired so a `401` from any request empties the cache, marks the
 * visitor anonymous and re-runs the loaders: the protected loader then sends them to login with a
 * return address. Nothing of the old session is left for the next user of this tab.
 */
export function createApp() {
  const queryClient = createQueryClient({
    onUnauthorized: () => {
      queryClient.clear()
      queryClient.setQueryData(authQueries.me().queryKey, null)
      void router.revalidate()
    },
  })
  const router = createAppRouter(queryClient)
  return { queryClient, router }
}
