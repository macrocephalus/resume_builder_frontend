import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { apiSend } from '@/shared/api/client'
import { apiPaths, paths } from '@/shared/config/paths'
import { forgetAllStoredReplies } from '@/entities/cv/model/storedReplies'
import { authQueries } from '@/features/auth/api/authQueries'

/**
 * Clears the cookie through the API, opens the login screen, then empties the query cache and
 * the replies kept in this browser.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => apiSend(apiPaths.logout, { method: 'POST' }),
    onSuccess: async () => {
      // Anonymous first, so the login loader does not send the visitor back; the rest of the
      // cache goes only after the signed-in screens are gone, so none of them refetches.
      queryClient.setQueryData(authQueries.me().queryKey, null)
      await navigate(paths.login(), { replace: true })
      queryClient.clear()
      forgetAllStoredReplies()
    },
  })
}
