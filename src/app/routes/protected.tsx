import type { QueryClient } from '@tanstack/react-query'
import { redirect, type LoaderFunctionArgs } from 'react-router'
import { ProtectedLayout } from '@/app/layout/ProtectedLayout'
import { paths } from '@/shared/config/paths'
import { authQueries } from '@/features/auth/api/authQueries'

export const loader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const user = await queryClient.ensureQueryData(authQueries.me())
    if (user) return null
    const { pathname, search } = new URL(request.url)
    return redirect(paths.login(pathname + search))
  }

export function Component() {
  return <ProtectedLayout />
}
