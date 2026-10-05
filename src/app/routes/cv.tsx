import type { QueryClient } from '@tanstack/react-query'
import { useParams, type LoaderFunctionArgs } from 'react-router'
import { RouteError } from '@/app/layout/RouteError'
import { authQueries } from '@/features/auth/api/authQueries'
import { CvScreen } from '@/features/cv-editor/components/CvScreen'
import { cvQueries } from '@/entities/cv/api/cvQueries'

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    // The protected loader redirects an anonymous visitor; don't ask for the CV meanwhile.
    if (!(await queryClient.ensureQueryData(authQueries.me()))) return null
    await queryClient.ensureQueryData(cvQueries.detail(params.cvId ?? ''))
    return null
  }

export function Component() {
  const { cvId = '' } = useParams()
  // Keyed by id, so moving to another CV starts its screen afresh.
  return <CvScreen key={cvId} cvId={cvId} />
}

export const ErrorBoundary = RouteError
