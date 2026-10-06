import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { exhaustHourlyLimit } from '@/mocks/handlers/cvs'
import { server } from '@/mocks/server'
import { seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const SOURCE =
  'Backend engineer, six years of Node.js and PostgreSQL at Fintory, mentored juniors. '.repeat(2)

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })
const create = () => screen.getByRole('button', { name: 'Create CV' })

async function fillForm() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Target role'), 'Platform Engineer')
  await user.type(screen.getByLabelText('About the role (optional)'), 'Kubernetes, on call')
  await user.selectOptions(screen.getByLabelText('CV language'), 'pl')
  await user.type(screen.getByLabelText('Your experience'), SOURCE)
  return user
}

describe('New CV limits', () => {
  test('show the generations used this hour and when the next one frees up', async () => {
    const ann = signedIn()
    const oldest = Date.now() - 20 * 60 * 1000
    updateDb((db) => {
      db.generations[ann.id] = [oldest, Date.now() - 1000, Date.now()]
    })
    renderApp('/cvs/new')

    const frees = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
      oldest + 60 * 60 * 1000,
    )
    expect(
      await screen.findByText(
        `3 of 10 generations used this hour · the next one frees up at ${frees}`,
      ),
    ).toBeVisible()
    expect(create()).toBeEnabled()
  })

  test('with the hourly limit used up, Create CV waits and says until when', async () => {
    exhaustHourlyLimit(signedIn().id)
    renderApp('/cvs/new')

    expect(
      await screen.findByText(/^You have used all 10 generations for this hour\. The next one/),
    ).toBeVisible()
    expect(create()).toBeDisabled()
  })

  test('with two CVs in progress, Create CV waits until one is done', async () => {
    const ann = signedIn()
    seedCv(ann, 'queued')
    seedCv(ann, 'generating')
    renderApp('/cvs/new')

    expect(
      await screen.findByText(
        'You already have 2 CVs being generated. Try again when one of them is done.',
      ),
    ).toBeVisible()
    expect(create()).toBeDisabled()
  })

  test('when the limits cannot be loaded, the form still works', async () => {
    signedIn()
    server.use(http.get('/api/usage', () => HttpResponse.error()))
    renderApp('/cvs/new')

    expect(await screen.findByText(/^Could not load your limits\./)).toBeVisible()
    const user = await fillForm()
    await user.click(create())

    expect(await screen.findByRole('heading', { name: 'Platform Engineer' })).toBeVisible()
  })
})
