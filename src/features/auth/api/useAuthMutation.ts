import { userResponseSchema, type Credentials } from '@cv/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/client'
import { authQueries } from '@/features/auth/api/authQueries'

/**
 * Signs in through `path`. The cache is emptied first, so nothing a previous user of this tab
 * loaded is shown to the new one.
 */
export function useAuthMutation(path: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiRequest(path, userResponseSchema, { method: 'POST', body: credentials }),
    onSuccess: ({ user }) => {
      queryClient.clear()
      queryClient.setQueryData(authQueries.me().queryKey, user)
    },
  })
}
