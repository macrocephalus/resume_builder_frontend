import type { QueryClient } from '@tanstack/react-query'
import { redirect, type LoaderFunctionArgs } from 'react-router'
import { paths, safeNext } from '@/shared/config/paths'
import { authQueries } from '@/features/auth/api/authQueries'
import { LoginScreen } from '@/features/auth/components/LoginScreen'

export const loader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const user = await queryClient.ensureQueryData(authQueries.me())
    if (!user) return null
    return redirect(safeNext(new URL(request.url).searchParams.get('next')) ?? paths.cvList())
  }

export function Component() {
  return <LoginScreen />
}
