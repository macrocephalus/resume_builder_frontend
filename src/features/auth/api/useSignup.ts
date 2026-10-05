import { apiPaths } from '@/shared/config/paths'
import { useAuthMutation } from '@/features/auth/api/useAuthMutation'

export function useSignup() {
  return useAuthMutation(apiPaths.signup)
}
