import { apiPaths } from '@/shared/config/paths'
import { useAuthMutation } from '@/features/auth/api/useAuthMutation'

export function useLogin() {
  return useAuthMutation(apiPaths.login)
}
