import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router'
import { NotFound } from '@/app/layout/NotFound'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { ErrorState } from '@/shared/ui/ErrorState'

/** The route error element: Not found for a `404`, otherwise the error with Retry. */
export function RouteError() {
  const error = useRouteError()
  const revalidator = useRevalidator()

  if ((isRouteErrorResponse(error) || error instanceof ApiError) && error.status === 404) {
    return (
      <main className="mx-auto max-w-page px-4 py-6">
        <NotFound />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-page px-4 py-6">
      <ErrorState
        title="Something went wrong"
        message={errorText(error)}
        onRetry={() => void revalidator.revalidate()}
        retrying={revalidator.state === 'loading'}
      />
    </main>
  )
}
