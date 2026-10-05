import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router'
import { NotFound } from '@/app/layout/NotFound'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { ErrorState } from '@/shared/ui/ErrorState'

/**
 * The route error element: Not found for a `404`, otherwise the error with Retry. It renders only
 * the message, so it fits inside a layout; `PageError` frames it for errors above every layout.
 */
export function RouteError() {
  const error = useRouteError()
  const revalidator = useRevalidator()

  if ((isRouteErrorResponse(error) || error instanceof ApiError) && error.status === 404) {
    return <NotFound />
  }

  return (
    <ErrorState
      title="Something went wrong"
      message={errorText(error)}
      onRetry={() => void revalidator.revalidate()}
      retrying={revalidator.state === 'loading'}
    />
  )
}
