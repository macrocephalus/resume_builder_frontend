import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from '@/app/App'

test('renders the app', () => {
  render(<App />)

  expect(screen.getByRole('heading', { level: 1, name: 'AI CV Builder' })).toBeVisible()
})
