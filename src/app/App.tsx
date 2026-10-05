import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import type { createAppRouter } from '@/app/router'

type AppProps = {
  queryClient: QueryClient
  router: ReturnType<typeof createAppRouter>
}

export function App({ queryClient, router }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
