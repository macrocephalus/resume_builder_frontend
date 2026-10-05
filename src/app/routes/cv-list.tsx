import type { QueryClient } from '@tanstack/react-query'
import { RouteError } from '@/app/layout/RouteError'
import { authQueries } from '@/features/auth/api/authQueries'
import { CvListScreen } from '@/features/cv-list/components/CvListScreen'
import { cvQueries } from '@/entities/cv/api/cvQueries'

export const loader = (queryClient: QueryClient) => async () => {
  // The protected loader redirects an anonymous visitor; don't ask for their CVs meanwhile.
  if (!(await queryClient.ensureQueryData(authQueries.me()))) return null
  await queryClient.ensureQueryData(cvQueries.list())
  return null
}

export function Component() {
  return <CvListScreen />
}

export const ErrorBoundary = RouteError
