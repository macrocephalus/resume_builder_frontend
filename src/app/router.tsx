import type { QueryClient } from '@tanstack/react-query'
import type { ComponentType } from 'react'
import { createBrowserRouter, type LoaderFunction } from 'react-router'
import { RootLayout } from '@/app/layout/RootLayout'
import { PageError } from '@/app/layout/PageError'
import { PageSkeleton } from '@/app/layout/PageSkeleton'
import { routes } from '@/shared/config/paths'

/** What a route module exports. Its loader is a function of the client, so tests get their own. */
type RouteModule = {
  Component: ComponentType
  loader?: (queryClient: QueryClient) => LoaderFunction
  ErrorBoundary?: ComponentType
  handle?: unknown
}

export function createAppRouter(queryClient: QueryClient) {
  // Every screen loads on first visit.
  const lazy = (load: () => Promise<RouteModule>) => async () => {
    const { loader, ...rest } = await load()
    return { ...rest, loader: loader?.(queryClient) }
  }

  return createBrowserRouter([
    {
      Component: RootLayout,
      HydrateFallback: PageSkeleton,
      children: [
        {
          ErrorBoundary: PageError,
          children: [
            { path: routes.login, lazy: lazy(() => import('@/app/routes/login')) },
            { path: routes.signup, lazy: lazy(() => import('@/app/routes/signup')) },
            {
              lazy: lazy(() => import('@/app/routes/protected')),
              children: [
                { index: true, lazy: lazy(() => import('@/app/routes/cv-list')) },
                // Unknown paths sit behind login, so a deep link survives the login redirect.
                { path: '*', lazy: lazy(() => import('@/app/routes/not-found')) },
              ],
            },
          ],
        },
      ],
    },
  ])
}
