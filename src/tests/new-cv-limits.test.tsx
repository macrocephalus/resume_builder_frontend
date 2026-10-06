import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { exhaustHourlyLimit } from '@/mocks/handlers/cvs'
import { server } from '@/mocks/server'
import { seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const SOURCE =
  'Backend engineer, six years of Node.js and PostgreSQL at Fintory, mentored juniors. '.repeat(2)

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })
const create = () => screen.getByRole('button', { name: 'Create CV' })

/** The bodies of the creates the app sends during the test. */
function createBodies() {
  const bodies: Record<string, unknown>[] = []
  const listener = async ({ request }: { request: Request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/cvs') {
      bodies.push(await request.clone().json())
    }
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return bodies
}

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

  test('with four CVs in progress, Create CV waits until one is done', async () => {
    const ann = signedIn()
    seedCv(ann, 'queued')
    seedCv(ann, 'queued')
    seedCv(ann, 'generating')
    seedCv(ann, 'retrying')
    renderApp('/cvs/new')

    expect(
      await screen.findByText(
        'You already have 4 CVs being generated. Try again when one of them is done.',
      ),
    ).toBeVisible()
    expect(create()).toBeDisabled()
  })

  test('with both limits reached the hourly one is named, and mock mode refuses with it first', async () => {
    const ann = signedIn()
    exhaustHourlyLimit(ann.id)
    for (let i = 0; i < 4; i += 1) seedCv(ann, 'queued')
    renderApp('/cvs/new')

    expect(
      await screen.findByText(/^You have used all 10 generations for this hour\. The next one/),
    ).toBeVisible()
    const response = await fetch(new URL('/api/cvs', window.location.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole: 'Platform Engineer', sourceText: SOURCE }),
    })
    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } })
  })

  test('a Retry counts at once: New CV never shows the count from before it', async () => {
    seedCv(signedIn(), 'failed', { title: 'Olena — Backend' })
    renderApp('/cvs/new')
    const user = userEvent.setup()
    await screen.findByText('0 of 10 generations used this hour')

    await user.click(screen.getByRole('link', { name: 'AI CV Builder' }))
    const row = await screen.findByRole('listitem', { name: 'Olena — Backend' })
    await user.click(within(row).getByRole('button', { name: 'Retry' }))
    await within(row).findByText('In queue')
    await user.click(screen.getByRole('link', { name: 'New CV' }))

    await screen.findByLabelText('Target role')
    expect(screen.queryByText('0 of 10 generations used this hour')).toBeNull()
    expect(await screen.findByText(/^1 of 10 generations used this hour/)).toBeVisible()
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

describe('New CV autosave', () => {
  test('an unsent form survives a reload', async () => {
    signedIn()
    renderApp('/cvs/new')
    await fillForm()

    renderApp('/cvs/new')

    expect(await screen.findByLabelText('Target role')).toHaveValue('Platform Engineer')
    expect(screen.getByLabelText('About the role (optional)')).toHaveValue('Kubernetes, on call')
    expect(screen.getByLabelText('CV language')).toHaveValue('pl')
    expect(screen.getByLabelText('Your experience')).toHaveValue(SOURCE)
  })

  test('a created CV leaves an empty form behind', async () => {
    signedIn()
    renderApp('/cvs/new')
    const user = await fillForm()
    await user.click(create())
    await screen.findByRole('heading', { name: 'Platform Engineer' })

    renderApp('/cvs/new')

    expect(await screen.findByLabelText('Target role')).toHaveValue('')
    expect(screen.getByLabelText('Your experience')).toHaveValue('')
  })

  test('a text from a PDF still counts as one after a reload', async () => {
    signedIn()
    const bodies = createBodies()
    renderApp('/cvs/new')
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(
      await screen.findByLabelText('Upload PDF'),
      new File(['%PDF-1.7 a CV'], 'olena-cv.pdf', { type: 'application/pdf' }),
    )
    await waitFor(() => expect(screen.getByLabelText('Your experience')).not.toHaveValue(''))

    renderApp('/cvs/new')
    await user.type(await screen.findByLabelText('Target role'), 'Platform Engineer')
    await user.click(create())

    await screen.findByRole('heading', { name: 'Platform Engineer' })
    expect(bodies[0]).toMatchObject({ sourceType: 'pdf', sourceFilename: 'olena-cv.pdf' })
  })

  test('a role in the link wins over the kept one', async () => {
    signedIn()
    renderApp('/cvs/new')
    await fillForm()

    renderApp('/cvs/new?role=SRE')

    expect(await screen.findByLabelText('Target role')).toHaveValue('SRE')
    expect(screen.getByLabelText('Your experience')).toHaveValue(SOURCE)
  })

  test('a blocked storage never breaks the form', async () => {
    signedIn()
    // A browser that refuses storage throws on the very access to it.
    const blocked = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    try {
      renderApp('/cvs/new')
      const user = await fillForm()
      await user.click(create())

      expect(await screen.findByRole('heading', { name: 'Platform Engineer' })).toBeVisible()
    } finally {
      blocked.mockRestore()
    }
  })
})
