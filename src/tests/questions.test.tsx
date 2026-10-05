import type { Cv } from '@cv/shared'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { generatedDraft } from '@/mocks/fixtures/draft'
import { server } from '@/mocks/server'
import { readDb, seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'
import { wideScreen } from '@/tests/wideScreen'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

const PHONE = 'What phone number should employers use?'
const ENGLISH = 'What is your level of English?'
const SKILLS = 'Which of these have you worked with? Only what you tick goes into the CV.'
const CLAIM = 'Your text does not say this. Should it stay in the CV?'

/** A CV that needs input, with one open question of each kind. */
async function openQuestions(overrides: Partial<Cv> = {}) {
  const cv = seedCv(signedIn(), 'needs_input', {
    title: 'Olena — Backend',
    ...generatedDraft({ withQuestions: true }),
    ...overrides,
  })
  renderApp(`/cvs/${cv.id}?tab=questions`)
  await screen.findByLabelText('CV title')
  return { cv, user: userEvent.setup() }
}

const card = (question: string) => screen.getByRole('region', { name: question })
const queryCard = (question: string) => screen.queryByRole('region', { name: question })
const tab = (name: RegExp) =>
  within(screen.getByRole('group', { name: 'Panel' })).getByRole('button', { name })
const answered = () => screen.getByText(/^Answered \(\d+\)$/)
const stored = (id: string) => readDb().cvs.find((entry) => entry.cv.id === id)!.cv

/** The method and path of every request the app sends during the test. */
function requests() {
  const sent: string[] = []
  const listener = ({ request }: { request: Request }) => {
    if (request.method !== 'GET') sent.push(`${request.method} ${new URL(request.url).pathname}`)
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return sent
}

describe('Questions panel', () => {
  test('lists the open questions with what each is about, under the fact-check report', async () => {
    await openQuestions()

    expect(tab(/^Questions · 4$/)).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText(
        '7 bullets confirmed by quotes from your text, 1 sent to you to confirm, 3 skills moved to suggestions, 2 unconfirmed fields cleared and asked about.',
      ),
    ).toBeVisible()
    expect(within(card(PHONE)).getByText('Contacts · Phone')).toBeVisible()
    expect(within(card(ENGLISH)).getByText('Languages · English')).toBeVisible()
    expect(within(card(SKILLS)).getByText('Skills')).toBeVisible()
    expect(within(card(CLAIM)).getByText('Experience · Fintory')).toBeVisible()
  })

  test('from 980 px the side panel switches between Questions and Preview', async () => {
    wideScreen()
    const cv = seedCv(signedIn(), 'needs_input', {
      title: 'Olena — Backend',
      ...generatedDraft({ withQuestions: true }),
    })
    renderApp(`/cvs/${cv.id}`)
    const user = userEvent.setup()
    await screen.findByLabelText('CV title')

    const panels = screen.getByRole('group', { name: 'Panel' })
    expect(
      within(panels)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Questions · 4', 'Preview'])
    expect(card(PHONE)).toBeVisible()
    expect(screen.getByRole('region', { name: 'Contacts' })).toBeVisible()

    await user.click(within(panels).getByRole('button', { name: 'Preview' }))
    expect(await screen.findByRole('region', { name: 'Preview' })).toBeVisible()
    expect(queryCard(PHONE)).toBeNull()
  })

  test('a ready CV without questions has no Questions panel', async () => {
    const cv = seedCv(signedIn(), 'ready')
    renderApp(`/cvs/${cv.id}?tab=questions`)
    await screen.findByLabelText('CV title')

    expect(
      within(screen.getByRole('group', { name: 'Panel' })).queryByRole('button', {
        name: /Questions/,
      }),
    ).toBeNull()
  })
})

describe('Answering', () => {
  test('a text answer fills its field and moves to Answered', async () => {
    const { user } = await openQuestions()
    const phone = card(PHONE)

    expect(within(phone).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.type(within(phone).getByLabelText('Your answer'), '   ')
    expect(within(phone).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.type(within(phone).getByLabelText('Your answer'), '+380 67 123 45 67')
    await user.click(within(phone).getByRole('button', { name: 'Answer' }))
    await screen.findByText(/^Answered \(1\)$/)

    expect(screen.getByLabelText(/^Phone/)).toHaveValue('+380 67 123 45 67')
    expect(queryCard(PHONE)).toBeNull()
    expect(tab(/^Questions · 3$/)).toBeVisible()
    await user.click(answered())
    expect(screen.getByText('+380 67 123 45 67', { selector: 'p' })).toBeVisible()
    // A closed question cannot be answered again.
    expect(queryCard(PHONE)).toBeNull()
  })

  test('a choice is one option, or Other with its own text', async () => {
    const { cv, user } = await openQuestions()
    const english = card(ENGLISH)
    const send = () => within(english).getByRole('button', { name: 'Answer' })

    expect(send()).toBeDisabled()
    await user.click(within(english).getByRole('button', { name: 'Other' }))
    expect(send()).toBeDisabled()
    await user.type(within(english).getByLabelText('Your own answer'), 'Fluent')
    await user.click(within(english).getByRole('button', { name: 'C1' }))
    expect(within(english).queryByLabelText('Your own answer')).toBeNull()
    await user.click(send())
    await screen.findByText(/^Answered \(1\)$/)

    const level = within(screen.getByRole('group', { name: 'Language 2' })).getByLabelText(/^Level/)
    expect(level).toHaveValue('C1')
    expect(stored(cv.id).questions.find((q) => q.label === 'English')?.answer).toBe('C1')
  })

  test('multi needs a ticked option or Other, and adds them to the skills', async () => {
    const { user } = await openQuestions()
    const skills = card(SKILLS)
    const send = () => within(skills).getByRole('button', { name: 'Answer' })

    expect(send()).toBeDisabled()
    await user.click(within(skills).getByRole('button', { name: 'Kafka' }))
    expect(within(skills).getByRole('button', { name: 'Kafka' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.type(within(skills).getByLabelText('Other, comma-separated'), 'NATS, Go')
    await user.click(send())
    await screen.findByText(/^Answered \(1\)$/)

    const chips = screen.getByRole('list', { name: 'Your skills' })
    expect(within(chips).getByText('Kafka')).toBeVisible()
    expect(within(chips).getByText('NATS')).toBeVisible()
    expect(within(chips).getByText('Go')).toBeVisible()
    expect(within(chips).queryByText('gRPC')).toBeNull()
  })

  test('a confirmation has no Skip; Yes adds the claim to its job', async () => {
    const { user } = await openQuestions()
    const claim = card(CLAIM)

    expect(
      within(claim).getByText('“Cut payment latency by 40% with a read-through Redis cache”'),
    ).toBeVisible()
    expect(within(claim).queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.click(within(claim).getByRole('button', { name: 'Yes, add it' }))
    await screen.findByText(/^Answered \(1\)$/)

    const job = screen.getByRole('group', { name: 'Job 1' })
    expect((within(job).getByLabelText('What you did') as HTMLTextAreaElement).value).toContain(
      'Cut payment latency by 40% with a read-through Redis cache',
    )
  })

  test('No leaves the claim out', async () => {
    const { user } = await openQuestions()

    await user.click(within(card(CLAIM)).getByRole('button', { name: 'No' }))

    await screen.findByText(/^Answered \(1\)$/)
    const job = screen.getByRole('group', { name: 'Job 1' })
    expect((within(job).getByLabelText('What you did') as HTMLTextAreaElement).value).not.toContain(
      'Cut payment latency',
    )
  })

  test('Skip closes a question and leaves its field empty', async () => {
    const { user } = await openQuestions()

    await user.click(within(card(PHONE)).getByRole('button', { name: 'Skip' }))

    await user.click(await screen.findByText(/^Answered \(1\)$/))
    expect(screen.getByText('Skipped')).toBeVisible()
    expect(screen.getByLabelText(/^Phone/)).toHaveValue('')
  })

  test('closing the last question makes the CV ready', async () => {
    const cv = seedCv(signedIn(), 'needs_input', { title: 'Olena — Backend' })
    renderApp(`/cvs/${cv.id}?tab=questions`)
    const user = userEvent.setup()

    await user.click(
      within(await screen.findByRole('region', { name: 'What is your phone?' })).getByRole(
        'button',
        { name: 'Skip' },
      ),
    )
    await screen.findByText(/^Answered \(1\)$/)
    await user.click(
      within(screen.getByRole('region', { name: 'What is your location?' })).getByRole('button', {
        name: 'Skip',
      }),
    )

    expect(await screen.findByText('No open questions.', { exact: false })).toBeVisible()
    expect(screen.getByText('Ready')).toBeVisible()
    expect(tab(/^Questions$/)).toBeVisible()
  })
})

describe('Answers and unsaved edits', () => {
  test('unsaved edits are saved before the answer is sent', async () => {
    const { cv, user } = await openQuestions()
    const sent = requests()

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'gRPC' }))
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'Answer' }))

    await screen.findByText(/^Answered \(1\)$/)
    expect(sent).toEqual([
      `PATCH /api/cvs/${cv.id}`,
      `POST /api/cvs/${cv.id}/questions/${cv.questions[2]!.id}/answer`,
    ])
    expect(screen.getByLabelText('About you')).toHaveValue(`${cv.data!.summary} More.`)
  })

  test('when that save fails the answer is not sent', async () => {
    const { user } = await openQuestions()
    const sent = requests()
    server.use(http.patch('/api/cvs/:id', () => HttpResponse.json(null, { status: 503 })))

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'gRPC' }))
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'Answer' }))

    expect(
      await within(card(SKILLS)).findByText(
        'Not sent: your edits could not be saved. Save them, then answer again.',
      ),
    ).toBeVisible()
    expect(sent.filter((request) => request.startsWith('POST'))).toEqual([])
    expect(tab(/^Questions · 4$/)).toBeVisible()
  })

  test('filling a field by hand does not close its question', async () => {
    const { user } = await openQuestions()

    await user.type(screen.getByLabelText(/^Phone/), '+380 67 123 45 67')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(card(PHONE)).toBeVisible()
  })

  test('removing the job a question is about removes the question after saving', async () => {
    const { user } = await openQuestions()

    await user.click(
      within(screen.getByRole('group', { name: 'Job 1' })).getByRole('button', { name: 'Remove' }),
    )
    expect(card(CLAIM)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')

    expect(queryCard(CLAIM)).toBeNull()
    expect(tab(/^Questions · 3$/)).toBeVisible()
  })

  test('a failed answer after the save keeps what was typed', async () => {
    const { user } = await openQuestions()
    server.use(
      http.post('/api/cvs/:id/questions/:questionId/answer', () =>
        HttpResponse.json(null, { status: 503 }),
      ),
    )

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.type(within(card(PHONE)).getByLabelText('Your answer'), '+380 67')
    await user.click(within(card(PHONE)).getByRole('button', { name: 'Answer' }))

    // The save remounts the form, so the card is looked up again.
    expect(await screen.findByText(/^Not sent\. Cannot reach the server/)).toBeVisible()
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67')
    expect((screen.getByLabelText('About you') as HTMLTextAreaElement).value).toMatch(/ More\.$/)
  })

  test('a question about a job removed elsewhere refreshes the CV and says why', async () => {
    const { cv, user } = await openQuestions()
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.data!.experience.shift()
      entry.cv.version += 1
    })

    await user.click(within(card(CLAIM)).getByRole('button', { name: 'Yes, add it' }))

    expect(
      await screen.findByText(
        'That question was already closed, or the part of the CV it was about is gone. The CV is now up to date.',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('group', { name: 'Job 2' })).toBeNull()
  })

  test('a question closed elsewhere refreshes the CV and says why', async () => {
    const { cv, user } = await openQuestions()
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.questions[0]!.status = 'skipped'
      entry.cv.version += 1
    })

    await user.type(within(card(PHONE)).getByLabelText('Your answer'), '+380 67')
    await user.click(within(card(PHONE)).getByRole('button', { name: 'Answer' }))

    expect(
      await screen.findByText(
        'That question was already closed, or the part of the CV it was about is gone. The CV is now up to date.',
      ),
    ).toBeVisible()
    expect(queryCard(PHONE)).toBeNull()
  })
})
