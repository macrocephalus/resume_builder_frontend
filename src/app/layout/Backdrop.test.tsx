import { render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { expect, test } from 'vitest'
import { Backdrop } from '@/app/layout/Backdrop'

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Backdrop />
            <Outlet />
          </>
        ),
        children: [
          { path: '/still', element: <p>Still screen</p> },
          { path: '/drift', element: <p>Drift screen</p>, handle: { backdrop: 'drift' } },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

test('is still when the route does not ask for motion', async () => {
  renderAt('/still')
  await screen.findByText('Still screen')

  expect(screen.getByTestId('backdrop')).toHaveAttribute('data-motion', 'still')
})

test('drifts when the current route asks for it', async () => {
  renderAt('/drift')
  await screen.findByText('Drift screen')

  expect(screen.getByTestId('backdrop')).toHaveAttribute('data-motion', 'drift')
})

test('is hidden from assistive technology', async () => {
  renderAt('/still')
  await screen.findByText('Still screen')

  expect(screen.getByTestId('backdrop')).toHaveAttribute('aria-hidden', 'true')
})
