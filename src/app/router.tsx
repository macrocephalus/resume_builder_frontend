import { createBrowserRouter } from 'react-router'
import { ProtectedLayout } from '@/app/layout/ProtectedLayout'
import { RootLayout } from '@/app/layout/RootLayout'

export function createAppRouter() {
  return createBrowserRouter([
    {
      Component: RootLayout,
      children: [
        {
          Component: ProtectedLayout,
          children: [
            {
              index: true,
              // Placeholder until the first screen lands.
              element: <h1>AI CV Builder</h1>,
            },
          ],
        },
      ],
    },
  ])
}
