import { hasDraft, type CvStatus } from '@cv/shared'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { exhaustHourlyLimit } from '@/mocks/handlers/cvs'
import { server } from '@/mocks/server'
import { seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const SOURCE =
  'Backend engineer, six years of Node.js and PostgreSQL at Fintory, mentored juniors. '.repeat(2)

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })
const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

/** Lets `ms` of time pass, so the fake worker moves on and polling runs. */
async function wait(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms))
}

/** Deletes a CV the way another tab or device would: behind this tab's back. */
const deleteElsewhere = (id: string) =>
  updateDb((db) => {
    db.cvs = db.cvs.filter((entry) => entry.cv.id !== id)
  })

/** How many status polls the app sends during the test. */
function statusPolls() {
  const polls = { count: 0 }
  const listener = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname === '/api/cvs/statuses') polls.count += 1
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return polls
}

async function createCv(role: string, user = setupUser()) {
  await user.type(await screen.findByLabelText('Target role'), role)
  await user.type(screen.getByLabelText('Your experience'), SOURCE)
  await user.click(screen.getByRole('button', { name: 'Create CV' }))
  return user
}

describe('New CV', () => {
  test('offers the CV languages by their own names, English first', async () => {
    signedIn()
    renderApp('/cvs/new')

    const select = await screen.findByLabelText('CV language')
    expect(select).toHaveValue('en')
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['English', 'Українська', 'Polski', 'Deutsch', 'Français', 'Español'])
  })

  test('checks the role and the text next to their fields', async () => {
    signedIn()
    renderApp('/cvs/new')
    const user = setupUser()

    await user.type(await screen.findByLabelText('Target role'), 'x')
    await user.type(screen.getByLabelText('Your experience'), 'Too short')
    await user.click(screen.getByRole('button', { name: 'Create CV' }))

    expect(screen.getByLabelText('Target role')).toHaveAccessibleDescription(
      expect.stringContaining('Name the role, at least 2 characters'),
    )
    expect(screen.getByLabelText('Your experience')).toHaveAccessibleDescription(
      expect.stringContaining('Add at least 80 characters about your experience'),
    )
  })

  test('counts the characters of the text', async () => {
    signedIn()
    renderApp('/cvs/new')

    await setupUser().type(await screen.findByLabelText('Your experience'), 'Twelve chars')

    expect(screen.getByText('12 / 20 000 characters')).toBeVisible()
  })

  test('says when four CVs are already being generated', async () => {
    const ann = signedIn()
    renderApp('/cvs/new')
    // Started in another tab after the form showed the limits.
    await screen.findByText('0 of 10 generations used this hour')
    seedCv(ann, 'queued')
    seedCv(ann, 'queued')
    seedCv(ann, 'generating')
    seedCv(ann, 'retrying')

    await createCv('Senior Backend Engineer')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have 4 CVs being generated. Try again when one of them is done.',
    )
    expect(window.location.pathname).toBe('/cvs/new')
    // The limits, asked again, now hold Create CV back, without saying it a second time.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create CV' })).toBeDisabled())
    expect(screen.getAllByText(/CVs being generated/)).toHaveLength(1)
  })

  test('says when the hourly limit lets the user try again', async () => {
    const ann = signedIn()
    renderApp('/cvs/new')
    // Used up in another tab after the form showed the limits.
    await screen.findByText('0 of 10 generations used this hour')
    exhaustHourlyLimit(ann.id)

    await createCv('Senior Backend Engineer')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have used all 10 generations for this hour. Try again in 60 minutes.',
    )
  })
})

describe('generation', () => {
  test('a new CV goes from the queue to a draft without a reload', async () => {
    signedIn()
    renderApp('/cvs/new')

    await createCv('Senior Backend Engineer')

    expect(await screen.findByRole('heading', { name: 'Senior Backend Engineer' })).toBeVisible()
    expect(window.location.pathname).toMatch(/^\/cvs\/[0-9a-f-]{36}$/)
    expect(screen.getByText('Starting soon')).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Generating your CV' })).toBeVisible()

    await wait(3000)
    expect(await screen.findByText('Writing your CV')).toBeVisible()
    expect(screen.getByText('Generating')).toBeVisible()

    await wait(3000)
    expect(await screen.findByText('Checking facts against your source')).toBeVisible()

    // The fact check rejected the draft once: it is revised, then checked again.
    await wait(3000)
    expect(await screen.findByText('Fixing unconfirmed facts')).toBeVisible()
    await wait(3000)
    expect(await screen.findByText('Checking facts against your source')).toBeVisible()

    await wait(6000)
    expect(await screen.findByText('4 open questions')).toBeVisible()
    expect(screen.getByText('Needs your answers')).toBeVisible()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('a reload during generation loses nothing', async () => {
    signedIn()
    renderApp('/cvs/new')
    await createCv('Senior Backend Engineer')
    await screen.findByText('Starting soon')
    await wait(3000)
    await screen.findByText('Writing your CV')

    renderApp(window.location.pathname)

    expect(await screen.findByText('Writing your CV')).toBeVisible()
    await wait(15000)
    expect(await screen.findByLabelText('CV title')).toBeVisible()
  })

  test('"retry" in the role shows a failed attempt being retried, then the draft', async () => {
    signedIn()
    renderApp('/cvs/new')
    await createCv('Retry Engineer')
    await screen.findByText('Starting soon')

    await wait(6000)
    expect(await screen.findByText('Attempt 1 of 3 failed, retrying…')).toBeVisible()
    expect(screen.getByText('Retrying')).toBeVisible()

    await wait(3000)
    expect(await screen.findByText('Writing your CV · attempt 2 of 3')).toBeVisible()

    await wait(15000)
    expect(await screen.findByLabelText('CV title')).toBeVisible()
  })

  test('"ready" in the role skips the revision and ends with no questions', async () => {
    signedIn()
    renderApp('/cvs/new')
    await createCv('Ready Engineer')
    await screen.findByText('Starting soon')

    // The fact check accepted the draft at once: nothing to revise.
    await wait(6000)
    expect(await screen.findByText('Checking facts against your source')).toBeVisible()
    await wait(3000)
    expect(await screen.findByText('Saving')).toBeVisible()

    await wait(6000)

    expect(await screen.findByLabelText('CV title')).toBeVisible()
    expect(screen.getByText('Ready')).toBeVisible()
    expect(screen.queryByText(/open question/)).toBeNull()
  })

  test('"fail" in the role fails every attempt, ends in Failed, and Retry starts again', async () => {
    signedIn()
    renderApp('/cvs/new')
    const user = await createCv('Fail Engineer')
    await screen.findByText('Starting soon')

    await wait(6000)
    expect(await screen.findByText('Attempt 1 of 3 failed, retrying…')).toBeVisible()
    // The wait doubles before each next attempt.
    await wait(6000)
    expect(await screen.findByText('Attempt 2 of 3 failed, retrying…')).toBeVisible()

    await wait(6000)
    expect(
      await screen.findByText(
        'The AI service is unavailable right now. Try again in a few minutes.',
      ),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Starting soon')).toBeVisible()
    await wait(18000)
    expect(await screen.findByLabelText('CV title')).toBeVisible()
  })

  test('a CV can be deleted while it is generated', async () => {
    signedIn()
    renderApp('/cvs/new')
    const user = await createCv('Senior Backend Engineer')
    await screen.findByText('Starting soon')

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete for good' }))

    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeVisible()
    expect(window.location.pathname).toBe('/')
  })

  test('one worker takes CVs in turn: the second waits in the queue, then both finish', async () => {
    const ann = signedIn()
    const now = Date.now()
    seedCv(ann, 'queued', { title: 'First' }, { queuedAt: now - 1000, scenario: 'ready' })
    const second = seedCv(ann, 'queued', { title: 'Second' }, { queuedAt: now, scenario: 'ready' })
    renderApp(`/cvs/${second.id}`)

    // The first is generating, so the second waits: still queued, whatever the progress line says
    // (how far the first got depends on the real time the run added to the fake clock).
    await wait(3000)
    expect(await screen.findByText('In queue')).toBeVisible()

    await wait(12000)
    // Which stage it is in depends on how much real time the run added to the fake clock.
    expect(await screen.findByText('Generating')).toBeVisible()
    await wait(12000)
    expect(await screen.findByLabelText('CV title')).toBeVisible()

    renderApp('/')
    await screen.findByRole('heading', { name: 'First' })
    for (const title of ['First', 'Second']) {
      expect(within(screen.getByRole('listitem', { name: title })).getByText('Ready')).toBeVisible()
    }
  })

  test('My CVs follows a CV in progress without a reload', async () => {
    const ann = signedIn()
    seedCv(ann, 'queued', { title: 'Olena — Backend' }, { queuedAt: Date.now(), scenario: 'ready' })
    renderApp('/')
    await screen.findByRole('heading', { name: 'Olena — Backend' })
    const row = () => screen.getByRole('listitem', { name: 'Olena — Backend' })
    expect(within(row()).getByText('In queue')).toBeVisible()

    await wait(3000)
    expect(await within(row()).findByText('Generating')).toBeVisible()

    await wait(12000)
    expect(await within(row()).findByText('Ready')).toBeVisible()
    expect(within(row()).getByRole('link', { name: 'Open' })).toBeVisible()
  })
})

describe('a CV deleted elsewhere while it is generated', () => {
  test('leaves My CVs, and polling stops', async () => {
    const ann = signedIn()
    const kept = seedCv(ann, 'ready', { title: 'Kept' })
    const gone = seedCv(
      ann,
      'queued',
      { title: 'Gone' },
      { queuedAt: Date.now(), scenario: 'ready' },
    )
    renderApp('/')
    await screen.findByRole('heading', { name: 'Gone' })
    const polls = statusPolls()

    deleteElsewhere(gone.id)
    await wait(3000)

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Gone' })).toBeNull())
    expect(screen.getByRole('heading', { name: kept.title })).toBeVisible()
    const after = polls.count
    await wait(9000)
    expect(polls.count).toBe(after)
  })

  test('its open page says it is gone, and polling stops', async () => {
    const cv = seedCv(signedIn(), 'generating', { title: 'Gone' })
    renderApp(`/cvs/${cv.id}`)
    await screen.findByText('Writing your CV')
    const polls = statusPolls()

    deleteElsewhere(cv.id)
    await wait(3000)

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
    const after = polls.count
    await wait(9000)
    expect(polls.count).toBe(after)
  })
})

describe('the CV screen by status', () => {
  test.each<[CvStatus, string | RegExp, string[], boolean]>([
    ['queued', 'Starting soon', ['Delete'], true],
    ['generating', 'Writing your CV', ['Delete'], true],
    ['retrying', 'Attempt 2 of 3 failed, retrying…', ['Delete'], true],
    [
      'failed',
      'The AI service is unavailable right now. Try again in a few minutes.',
      ['Retry', 'Delete'],
      false,
    ],
    ['needs_input', '2 open questions', ['Delete'], false],
    ['ready', 'Ready', ['Delete'], false],
  ])('%s shows its panel and actions', async (status, text, actions, drifts) => {
    const cv = seedCv(signedIn(), status, { title: 'Olena — Backend' })
    renderApp(`/cvs/${cv.id}`)

    expect(await screen.findByText(text)).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Olena — Backend' })).toBeVisible()
    const main = screen.getByRole('main')
    const buttons = within(main)
      .getAllByRole('button')
      .map((button) => button.textContent)
    // A CV with a draft shows the editor, with its own buttons around the CV actions.
    if (hasDraft(status)) expect(buttons).toEqual(expect.arrayContaining(actions))
    else expect(buttons).toEqual(actions)
    // The backdrop drifts while the generation panel is on screen (CSS :has on this marker).
    expect(document.querySelector('[data-backdrop="drift"]') !== null).toBe(drifts)
  })

  test("another user's CV is not found", async () => {
    signedIn()
    const bob = seedUser('bob@example.com', 'correct-horse')
    const cv = seedCv(bob, 'ready')
    renderApp(`/cvs/${cv.id}`)

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
