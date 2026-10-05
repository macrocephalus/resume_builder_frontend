import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from '@/app/App'
import { createAppRouter } from '@/app/router'

test('shows the product name in the top bar', async () => {
  render(<App router={createAppRouter()} />)

  const topBar = await screen.findByRole('banner')

  expect(topBar).toHaveTextContent('AI CV Builder')
})
