import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { server } from '@/mocks/server'
import { seedUser } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const EMAIL = 'ann@example.com'
const PASSWORD = 'correct-horse'

async function fillAndSubmit(email: string, password: string, submit: 'Log in' | 'Create account') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: submit }))
  return user
}

const location = () => window.location.pathname + window.location.search

describe('sign up', () => {
  test('creates an account and opens My CVs with the email in the top bar', async () => {
    renderApp('/signup')

    await fillAndSubmit(' Ann@Example.com ', PASSWORD, 'Create account')

    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
    expect(within(screen.getByRole('banner')).getByText(EMAIL)).toBeVisible()
    expect(location()).toBe('/')
  })

  test('shows a taken email next to the email field', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/signup')

    await fillAndSubmit(EMAIL, PASSWORD, 'Create account')

    const email = screen.getByLabelText('Email')
    await waitFor(() => expect(email).toHaveAccessibleDescription(/already exists/))
    expect(email).toHaveAttribute('aria-invalid', 'true')
  })

  test('checks the fields before sending', async () => {
    renderApp('/signup')

    await fillAndSubmit('ann', 'short', 'Create account')

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email, like name@example.com',
    )
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'At least 8 characters. Use at least 8 characters',
    )
  })

  test('uses the autocomplete hints password managers need', async () => {
    renderApp('/signup')

    expect(await screen.findByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
  })
})

describe('log in', () => {
  test('opens My CVs and keeps the session after a reload', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login')

    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')
    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()

    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
  })

  test('shows one neutral message for a wrong password and for an unknown email', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login')

    await fillAndSubmit(EMAIL, 'wrong-password', 'Log in')
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')

    renderApp('/login')
    await fillAndSubmit('nobody@example.com', PASSWORD, 'Log in')
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')
  })

  test('says when to try again after too many attempts', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login')
    const user = await fillAndSubmit(EMAIL, 'wrong-password', 'Log in')
    for (let attempt = 1; attempt < 6; attempt++) {
      await screen.findByRole('alert')
      await user.click(screen.getByRole('button', { name: 'Log in' }))
    }

    expect(await screen.findByText('Too many attempts. Try again in 15 minutes.')).toBeVisible()
  })

  test('shows and hides the password', async () => {
    renderApp('/login')
    const user = userEvent.setup()
    const password = await screen.findByLabelText('Password')

    const toggle = screen.getByRole('button', { name: 'Show password' })

    await user.click(toggle)
    expect(password).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(password).toHaveAttribute('type', 'password')
  })

  test('links to sign up and back, keeping the return address', async () => {
    renderApp('/login?next=%2Fcvs%2F1')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: 'Sign up' }))
    expect(location()).toBe('/signup?next=%2Fcvs%2F1')
    await user.click(await screen.findByRole('link', { name: 'Log in' }))
    expect(location()).toBe('/login?next=%2Fcvs%2F1')
  })
})

describe('protected screens', () => {
  test('send an anonymous visitor to login and back to the link afterwards', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/cvs/1?tab=questions')

    await screen.findByRole('heading', { name: 'Log in' })
    expect(location()).toBe('/login?next=%2Fcvs%2F1%3Ftab%3Dquestions')

    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')
    await waitFor(() => expect(location()).toBe('/cvs/1?tab=questions'))
  })

  test('ignore a return address on another site', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login?next=https%3A%2F%2Fevil.example')

    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')

    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
    expect(location()).toBe('/')
  })

  test('send a signed-in user from login to the return address', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login')
    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')
    await screen.findByRole('heading', { name: 'My CVs' })

    renderApp('/login?next=%2Fno-such-page')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('send a signed-in user from login to My CVs', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login')
    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')
    await screen.findByRole('heading', { name: 'My CVs' })

    renderApp('/signup')

    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
    expect(location()).toBe('/')
  })

  test('show Not found for an unknown path', async () => {
    seedUser(EMAIL, PASSWORD)
    renderApp('/login?next=%2Fno-such-page')
    await fillAndSubmit(EMAIL, PASSWORD, 'Log in')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})

describe('session end', () => {
  test('log out clears the session and opens login', async () => {
    renderApp('/signup')
    const user = await fillAndSubmit(EMAIL, PASSWORD, 'Create account')
    await screen.findByRole('heading', { name: 'My CVs' })

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
    expect(location()).toBe('/login')
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
  })
})

describe('without a backend', () => {
  test('says the server cannot be reached and retries', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.error(), { once: true }))
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
  })

  test('says the same when the proxy in front of a stopped backend answers 502', async () => {
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 502 })))
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.')
  })

  test('treats a response that breaks the contract as an error, never as data', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ user: { id: 'not-a-uuid' } })))
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.')
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })
})
