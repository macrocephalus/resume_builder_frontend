import type { QueryClient } from '@tanstack/react-query'
import type { LoaderFunctionArgs } from 'react-router'
import { RouteError } from '@/app/layout/RouteError'
import { authQueries } from '@/features/auth/api/authQueries'
import { parentCvQuery } from '@/features/cv-create/api/parentCv'
import { CvCreateScreen } from '@/features/cv-create/components/CvCreateScreen'

export const loader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    // The protected loader redirects an anonymous visitor; don't ask for the CV meanwhile.
    if (!(await queryClient.ensureQueryData(authQueries.me()))) return null
    const parent = parentCvQuery(new URL(request.url).searchParams)
    if (parent) await queryClient.ensureQueryData(parent)
    return null
  }

export function Component() {
  return <CvCreateScreen />
}

export const ErrorBoundary = RouteError
