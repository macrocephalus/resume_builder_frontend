import { RouteError } from '@/app/layout/RouteError'

/** A route error above every layout (for example the session check failed): a page of its own. */
export function PageError() {
  return (
    <main className="mx-auto max-w-page px-4 py-6 lg:px-6">
      <RouteError />
    </main>
  )
}
