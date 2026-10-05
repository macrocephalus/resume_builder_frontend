import type { Cv } from '@cv/shared'
import { focusManager } from '@tanstack/react-query'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { server } from '@/mocks/server'
import { readDb, seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

/** A ready CV with a small draft: one job, two skills, no phone. */
async function openEditor(overrides: Partial<Cv> = {}) {
  const cv = seedCv(signedIn(), 'ready', { title: 'Olena — Backend', ...overrides })
  renderApp(`/cvs/${cv.id}`)
  // The first visit loads the lazy route module, which can take a while in a cold test run.
  await screen.findByLabelText('CV title', {}, { timeout: 5000 })
  return { cv, user: userEvent.setup() }
}

const block = (name: string) => screen.getByRole('region', { name })
const saveBar = () => screen.queryByRole('region', { name: 'Unsaved changes' })

/** The PATCH bodies the app sends during the test. */
function patchBodies() {
  const bodies: Record<string, unknown>[] = []
  const listener = async ({ request }: { request: Request }) => {
    if (request.method === 'PATCH') bodies.push(await request.clone().json())
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return bodies
}

/** Another tab saves the CV first: a new version with another summary. */
function saveInAnotherTab(id: string) {
  updateDb((db) => {
    const entry = db.cvs.find((own) => own.cv.id === id)!
    entry.cv = {
      ...entry.cv,
      version: entry.cv.version + 1,
      data: { ...entry.cv.data!, summary: 'Saved in another tab.' },
    }
  })
}

const storedCv = (id: string) => readDb().cvs.find((entry) => entry.cv.id === id)?.cv

describe('Draft editor', () => {
  test('shows every block of the draft with its values', async () => {
    await openEditor()

    expect(screen.getByLabelText('CV title')).toHaveValue('Olena — Backend')
    for (const name of [
      'Contacts',
      'Summary',
      'Experience',
      'Projects',
      'Education',
      'Certifications',
      'Skills',
      'Languages',
    ]) {
      expect(block(name)).toBeVisible()
    }
    expect(within(block('Contacts')).getByLabelText(/^Full name/)).toHaveValue('Olena Hnatiuk')
    expect(within(block('Experience')).getByLabelText(/^Job title/)).toHaveValue('Backend Engineer')
    expect(within(block('Experience')).getByLabelText('What you did')).toHaveValue(
      'Built the payments API on Node.js',
    )
    expect(within(block('Skills')).getByText('PostgreSQL')).toBeVisible()
    expect(saveBar()).toBeNull()
  })

  test('saves an edit, says so, and keeps it after a reload', async () => {
    const { cv, user } = await openEditor()

    const summary = screen.getByLabelText('About you')
    await user.clear(summary)
    await user.type(summary, 'Platform engineer.')
    expect(saveBar()).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved ✓')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(storedCv(cv.id)?.version).toBe(2)

    renderApp(`/cvs/${cv.id}`)
    expect(await screen.findByLabelText('About you')).toHaveValue('Platform engineer.')
  })

  test('Cancel puts the saved values back', async () => {
    const { user } = await openEditor()

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL.',
    )
    expect(saveBar()).toBeNull()

    // A second round: an added item goes too.
    await user.click(screen.getByRole('button', { name: 'Add job' }))
    await user.type(screen.getByLabelText('About you'), ' Again.')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('group', { name: 'Job 2' })).toBeNull()
    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL.',
    )
  })

  test('renaming sends only the title', async () => {
    const { cv, user } = await openEditor()
    const bodies = patchBodies()

    const title = screen.getByLabelText('CV title')
    await user.clear(title)
    await user.type(title, 'Olena — Platform')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText('Saved ✓')
    expect(bodies).toEqual([{ version: 1, title: 'Olena — Platform' }])
    expect(storedCv(cv.id)?.title).toBe('Olena — Platform')
  })

  test('an empty title is not saved', async () => {
    const { user } = await openEditor()

    await user.clear(screen.getByLabelText('CV title'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText('CV title')).toHaveAccessibleDescription('Give the CV a title')
    expect(screen.getByLabelText('CV title')).toHaveFocus()
  })

  test('adds a job, moves it up and saves the order', async () => {
    const { cv, user } = await openEditor()

    await user.click(screen.getByRole('button', { name: 'Add job' }))
    const added = screen.getByRole('group', { name: 'Job 2' })
    expect(within(added).getByLabelText(/^Job title/)).toHaveFocus()
    await user.type(within(added).getByLabelText(/^Job title/), 'Platform Engineer')
    await user.type(within(added).getByLabelText(/^Company/), 'Acme')
    await user.type(within(added).getByLabelText(/^Period/), '2025 – present')
    await user.click(within(added).getByRole('button', { name: 'Move up' }))

    expect(
      within(screen.getByRole('group', { name: 'Job 1' })).getByLabelText(/^Company/),
    ).toHaveValue('Acme')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    const jobs = storedCv(cv.id)?.data?.experience ?? []
    expect(jobs.map((job) => job.company)).toEqual(['Acme', 'Fintory'])
    expect(jobs[0]?.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('removes a job', async () => {
    const { cv, user } = await openEditor()

    await user.click(
      within(screen.getByRole('group', { name: 'Job 1' })).getByRole('button', { name: 'Remove' }),
    )
    expect(within(block('Experience')).getByText(/No jobs yet/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(storedCv(cv.id)?.data?.experience).toEqual([])
  })

  test('drops an item left empty', async () => {
    const { cv, user } = await openEditor()

    await user.click(screen.getByRole('button', { name: 'Add language' }))
    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(storedCv(cv.id)?.data?.languages).toEqual([])
    expect(within(block('Languages')).getByText(/No languages yet/)).toBeVisible()
  })

  test('adds and removes skills as chips', async () => {
    const { cv, user } = await openEditor()

    await user.type(screen.getByLabelText('Add a skill'), 'Kafka{Enter}')
    await user.click(screen.getByRole('button', { name: 'Remove Node.js' }))
    expect(screen.getByLabelText('Add a skill')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(storedCv(cv.id)?.data?.skills).toEqual(['PostgreSQL', 'Kafka'])
  })

  test('marks missing required parts while typing', async () => {
    const { user } = await openEditor()

    // The sample draft has an email but no phone, so neither is missing yet.
    expect(within(block('Contacts')).queryByText('missing')).toBeNull()
    await user.clear(screen.getByLabelText(/^Email/))
    expect(screen.getByLabelText(/^Email/)).toHaveAccessibleName('Email missing')
    expect(screen.getByLabelText(/^Phone/)).toHaveAccessibleName('Phone missing')

    await user.clear(screen.getByLabelText('About you'))
    expect(within(block('Summary')).getByText('missing')).toBeVisible()
  })

  test('a failed save shows the error and can be tried again', async () => {
    const { user } = await openEditor()
    server.use(
      http.patch('/api/cvs/:id', () => HttpResponse.json(null, { status: 503 }), { once: true }),
    )

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Not saved\. Cannot reach the server/,
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved ✓')).toBeVisible()
  })

  test('a save from a stale tab shows the conflict and reloads the latest version', async () => {
    const { cv, user } = await openEditor()
    saveInAnotherTab(cv.id)

    await user.type(screen.getByLabelText('About you'), ' Mine.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const notice = await screen.findByText(/Reload the latest version to keep editing/)
    expect(storedCv(cv.id)?.data?.summary).toBe('Saved in another tab.')
    // Saving again could only conflict again.
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Reload latest' }))

    expect(await screen.findByDisplayValue('Saved in another tab.')).toBeVisible()
    expect(notice).not.toBeInTheDocument()
    expect(saveBar()).toBeNull()
  })

  test('coming back to the tab after a save elsewhere keeps the unsaved edits', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    onTestFinished(() => {
      focusManager.setFocused(undefined)
      vi.useRealTimers()
    })
    const cv = seedCv(signedIn(), 'ready', { title: 'Olena — Backend' })
    renderApp(`/cvs/${cv.id}`)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(await screen.findByLabelText('About you', {}, { timeout: 5000 }), ' Mine.')
    saveInAnotherTab(cv.id)

    // Long enough for the CV to count as stale, then the tab loses and regains focus.
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })
    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL. Mine.',
    )
  })

  test('a failed reload keeps the conflict notice', async () => {
    const { cv, user } = await openEditor()
    saveInAnotherTab(cv.id)
    await user.type(screen.getByLabelText('About you'), ' Mine.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/Reload the latest version to keep editing/)

    server.use(
      http.get('/api/cvs/:id', () => HttpResponse.json(null, { status: 503 }), { once: true }),
    )
    await user.click(screen.getByRole('button', { name: 'Reload latest' }))

    expect(await screen.findByText(/Could not reload\. Cannot reach the server/)).toBeVisible()
    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL. Mine.',
    )
  })

  test('asks before leaving with unsaved changes', async () => {
    const { user } = await openEditor()

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('link', { name: 'AI CV Builder' }))

    expect(screen.getByText('Leave without saving?')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Stay' }))
    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL. More.',
    )

    await user.click(screen.getByRole('link', { name: 'AI CV Builder' }))
    await user.click(screen.getByRole('button', { name: 'Leave' }))
    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
  })

  test('asks the browser to confirm closing the tab only with unsaved changes', async () => {
    const { user } = await openEditor()
    const close = () => window.dispatchEvent(new Event('beforeunload', { cancelable: true }))

    expect(close()).toBe(true)
    await user.type(screen.getByLabelText('About you'), ' More.')
    expect(close()).toBe(false)
  })

  test('leaves without asking once there is nothing to save', async () => {
    const { user } = await openEditor()

    await user.click(screen.getByRole('link', { name: 'AI CV Builder' }))
    expect(await screen.findByRole('heading', { name: 'My CVs' })).toBeVisible()
  })

  test('deleting the CV with unsaved changes does not ask again', async () => {
    const { user } = await openEditor()

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete for good' }))

    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeVisible()
  })

  test('removing the job a question is about skips the question', async () => {
    const cv = seedCv(signedIn(), 'needs_input', { title: 'Olena — Backend' })
    const jobId = cv.data!.experience[0]!.id
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.questions = entry.cv.questions.map((question) => ({
        ...question,
        target: { section: 'experience', itemId: jobId, field: 'period' },
      }))
    })
    renderApp(`/cvs/${cv.id}`)
    const user = userEvent.setup()

    await user.click(
      within(await screen.findByRole('group', { name: 'Job 1' })).getByRole('button', {
        name: 'Remove',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(screen.getByText('Ready')).toBeVisible()
  })
})
