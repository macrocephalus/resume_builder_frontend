import { useQuery, type QueryClient } from '@tanstack/react-query'
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
  // Replies not applied yet are kept per user, so the screen needs to know whose they are.
  const { data: userId } = useQuery({ ...authQueries.me(), select: (user) => user?.id ?? null })
  // An anonymous visitor is on the way to login (the protected loader): nothing to show meanwhile.
  if (!userId) return null
  // Keyed by id, so moving to another CV starts its screen afresh.
  return <CvScreen key={cvId} cvId={cvId} userId={userId} />
}

export const ErrorBoundary = RouteError
