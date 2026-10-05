import { RouterProvider, type RouterProviderProps } from 'react-router'

export function App({ router }: { router: RouterProviderProps['router'] }) {
  return <RouterProvider router={router} />
}
