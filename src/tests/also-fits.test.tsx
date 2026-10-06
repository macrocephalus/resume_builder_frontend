import type { Cv } from '@cv/shared'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { server } from '@/mocks/server'
import { readDb, seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

/** A ready Ukrainian CV made from a PDF, which also fits four roles. */
function seedParent(overrides: Partial<Cv> = {}) {
  const owner = signedIn()
  const parent = seedCv(owner, 'ready', {
    title: 'Olena — Backend',
    language: 'uk',
    sourceType: 'pdf',
    sourceFilename: 'olena-cv.pdf',
    suggestedRoles: ['Node.js Tech Lead', 'Platform Engineer', 'Site Reliability Engineer', 'CTO'],
    ...overrides,
  })
  return { owner, parent }
}

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

const create = () => screen.getByRole('button', { name: 'Create CV' })

describe('Also fits', () => {
  test('a role chip opens New CV prefilled, and creates a CV from the same source', async () => {
    const { parent } = seedParent()
    const bodies = createBodies()
    renderApp(`/cvs/${parent.id}`)
    const user = userEvent.setup()

    const chips = await screen.findByRole('list', { name: 'Also fits' })
    expect(
      within(chips)
        .getAllByRole('link')
        .map((chip) => chip.textContent),
    ).toEqual(['Node.js Tech Lead', 'Platform Engineer', 'Site Reliability Engineer'])

    await user.click(within(chips).getByRole('link', { name: 'Platform Engineer' }))

    expect(await screen.findByLabelText('Target role')).toHaveValue('Platform Engineer')
    expect(screen.getByLabelText('CV language')).toHaveValue('uk')
    expect(screen.getByText(/Made from your CV “Olena — Backend”/)).toBeVisible()
    expect(screen.queryByLabelText('Your experience')).toBeNull()

    await user.click(create())

    expect(await screen.findByRole('heading', { name: 'Platform Engineer' })).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Generating your CV' })).toBeVisible()
    expect(bodies).toEqual([
      {
        targetRole: 'Platform Engineer',
        roleContext: null,
        language: 'uk',
        fromCvId: parent.id,
      },
    ])
    const created = readDb().cvs.find((entry) => entry.cv.targetRole === 'Platform Engineer')!.cv
    expect(created).toMatchObject({ sourceType: 'pdf', sourceFilename: 'olena-cv.pdf' })
  })

  test('a CV from another one counts toward the limits', async () => {
    const { owner, parent } = seedParent()
    seedCv(owner, 'generating')
    seedCv(owner, 'queued')
    renderApp(`/cvs/new?fromCvId=${parent.id}&role=CTO`)

    expect(
      await screen.findByText(
        'You already have 2 CVs being generated. Try again when one of them is done.',
      ),
    ).toBeVisible()
    expect(create()).toBeDisabled()
  })

  test('says so when the CV it starts from was deleted meanwhile', async () => {
    const { parent } = seedParent()
    renderApp(`/cvs/new?fromCvId=${parent.id}&role=CTO`)
    const user = userEvent.setup()
    await screen.findByLabelText('Target role')
    updateDb((db) => {
      db.cvs = db.cvs.filter((entry) => entry.cv.id !== parent.id)
    })

    await user.click(create())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The CV you started from is gone. Start a new CV with your own text instead.',
    )
  })

  test('a CV still being generated cannot be started from', async () => {
    const owner = signedIn()
    const parent = seedCv(owner, 'generating', { title: 'Olena — Backend' })
    renderApp(`/cvs/new?fromCvId=${parent.id}&role=CTO`)
    const user = userEvent.setup()

    expect(
      await screen.findByText(
        '“Olena — Backend” has no draft yet, so a new CV cannot start from it.',
      ),
    ).toBeVisible()
    expect(screen.queryByLabelText('Target role')).toBeNull()

    await user.click(screen.getByRole('link', { name: 'Use your own text' }))
    expect(await screen.findByLabelText('Your experience')).toBeVisible()
  })

  test('another user’s CV cannot be started from', async () => {
    const stranger = seedUser('bob@example.com', 'correct-horse')
    const foreign = seedCv(stranger, 'ready')
    signedIn()
    renderApp(`/cvs/new?fromCvId=${foreign.id}&role=CTO`)

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('a link with a broken CV id opens the plain form with the role', async () => {
    signedIn()
    renderApp('/cvs/new?fromCvId=not-an-id&role=Platform+Engineer')

    expect(await screen.findByLabelText('Target role')).toHaveValue('Platform Engineer')
    expect(screen.getByLabelText('Your experience')).toBeVisible()
  })

  test('a CV with no suggested roles shows no chips', async () => {
    const { parent } = seedParent({ suggestedRoles: [] })
    renderApp(`/cvs/${parent.id}`)

    await screen.findByLabelText('CV title')
    expect(screen.queryByRole('list', { name: 'Also fits' })).toBeNull()
  })
})
