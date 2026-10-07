import type { Cv } from '@cv/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { storedRepliesKey } from '@/entities/cv/model/storedReplies'
import { seedCv } from '@/mocks/fixtures/cv'
import { generatedDraft } from '@/mocks/fixtures/draft'
import { errorResponse } from '@/mocks/respond'
import { server } from '@/mocks/server'
import { readDb, seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'
import { wideScreen } from '@/tests/wideScreen'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

const PHONE = 'What phone number should employers use? An email or a phone number is enough.'
const ENGLISH = 'What is your level of English?'
const SKILLS = 'Which of these have you worked with? Only what you tick goes into the CV.'
const CLAIM = 'Your text does not say this. Should it stay in the CV?'
const QUESTIONS_CHANGED = 'Some questions changed — check your replies and apply again.'

/** A CV that needs input, with one open question of each kind. */
async function openQuestions(overrides: Partial<Cv> = {}) {
  const owner = signedIn()
  const cv = seedCv(owner, 'needs_input', {
    title: 'Olena — Backend',
    ...generatedDraft({ withQuestions: true }),
    ...overrides,
  })
  renderApp(`/cvs/${cv.id}?tab=questions`)
  await screen.findByLabelText('CV title')
  return { cv, owner, user: userEvent.setup() }
}

// A new CV version remounts the editor, the panel and the bar: every lookup below asks the
// document afresh, and a wait re-runs its lookup until the tree after the remount has it.
const card = (question: string) => screen.getByRole('region', { name: question })
const queryCard = (question: string) => screen.queryByRole('region', { name: question })
const tab = (name: RegExp) =>
  within(screen.getByRole('group', { name: 'Panel' })).getByRole('button', { name })
/** Waits for the tab with this count: it comes with the CV from the server. */
const tabShows = (name: string) => screen.findByRole('button', { name })
const answered = () => screen.getByText(/^Answered \(\d+\)$/)
const bar = () => screen.getByRole('region', { name: 'Apply replies' })
const queryBar = () => screen.queryByRole('region', { name: 'Apply replies' })
const applyButton = () => within(bar()).getByRole('button', { name: /^Apply \d+ repl/ })
const barSays = (text: string | RegExp) =>
  waitFor(() => expect(within(bar()).getByText(text)).toBeVisible())
const noticeSays = (text: string) => waitFor(() => expect(screen.getByText(text)).toBeVisible())
const stored = (id: string) => readDb().cvs.find((entry) => entry.cv.id === id)!.cv

/** The method and path of every request the app sends during the test, and the body of each POST. */
function requests() {
  const sent: string[] = []
  const bodies: Promise<unknown>[] = []
  const listener = ({ request }: { request: Request }) => {
    if (request.method === 'GET') return
    sent.push(`${request.method} ${new URL(request.url).pathname}`)
    if (request.method === 'POST') bodies.push(request.clone().json())
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return { sent, bodies }
}

type User = ReturnType<typeof userEvent.setup>

const answerPhone = async (user: User, value = '+380 67 123 45 67') => {
  await user.type(within(card(PHONE)).getByLabelText('Your answer'), value)
  await user.click(within(card(PHONE)).getByRole('button', { name: 'Answer' }))
}

const answerSkills = async (user: User) => {
  await user.click(within(card(SKILLS)).getByRole('button', { name: 'Kafka' }))
  await user.click(within(card(SKILLS)).getByRole('button', { name: 'Answer' }))
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
    expect(queryBar()).toBeNull()
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
    ).toEqual(['Questions · 4', 'Match', 'Preview'])
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

describe('Replying', () => {
  test('Answer marks the card and sends nothing; Change opens it again with its draft', async () => {
    const { user } = await openQuestions()
    const { sent } = requests()

    expect(within(card(PHONE)).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.type(within(card(PHONE)).getByLabelText('Your answer'), '   ')
    expect(within(card(PHONE)).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.clear(within(card(PHONE)).getByLabelText('Your answer'))
    await answerPhone(user)

    expect(sent).toEqual([])
    expect(within(card(PHONE)).getByText('Contacts · Phone')).toBeVisible()
    expect(within(card(PHONE)).getByText('+380 67 123 45 67')).toBeVisible()
    expect(within(card(PHONE)).queryByLabelText('Your answer')).toBeNull()
    expect(applyButton()).toHaveTextContent('Apply 1 reply')
    // The server still has four open questions.
    expect(tab(/^Questions · 4$/)).toBeVisible()

    await user.click(within(card(PHONE)).getByRole('button', { name: 'Change' }))
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67 123 45 67')
    expect(queryBar()).toBeNull()
  })

  test('a choice, a multi, a confirmation and a skip each fold to one line', async () => {
    const { user } = await openQuestions()

    const english = card(ENGLISH)
    expect(within(english).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.click(within(english).getByRole('button', { name: 'Other' }))
    expect(within(english).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.type(within(english).getByLabelText('Your own answer'), 'Fluent')
    await user.click(within(english).getByRole('button', { name: 'C1' }))
    expect(within(english).queryByLabelText('Your own answer')).toBeNull()
    await user.click(within(english).getByRole('button', { name: 'Answer' }))
    expect(within(card(ENGLISH)).getByText('C1')).toBeVisible()

    const skills = card(SKILLS)
    expect(within(skills).getByRole('button', { name: 'Answer' })).toBeDisabled()
    await user.click(within(skills).getByRole('button', { name: 'Kafka' }))
    expect(within(skills).getByRole('button', { name: 'Kafka' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.type(within(skills).getByLabelText('Other, comma-separated'), 'NATS, Go')
    await user.click(within(skills).getByRole('button', { name: 'Answer' }))
    expect(within(card(SKILLS)).getByText('Kafka, NATS, Go')).toBeVisible()

    const claim = card(CLAIM)
    expect(
      within(claim).getByText('“Cut payment latency by 40% with a read-through Redis cache”'),
    ).toBeVisible()
    expect(within(claim).queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.click(within(claim).getByRole('button', { name: 'Yes, add it' }))
    expect(within(card(CLAIM)).getByText('Yes')).toBeVisible()
    await user.click(within(card(CLAIM)).getByRole('button', { name: 'Change' }))
    await user.click(within(card(CLAIM)).getByRole('button', { name: 'No' }))
    expect(within(card(CLAIM)).getByText('No')).toBeVisible()

    await user.click(within(card(PHONE)).getByRole('button', { name: 'Skip' }))
    expect(within(card(PHONE)).getByText('Skipped')).toBeVisible()

    expect(applyButton()).toHaveTextContent('Apply 4 replies')
  })

  test('Clear opens every card again and keeps the drafts', async () => {
    const { user } = await openQuestions()

    await answerPhone(user)
    await answerSkills(user)
    expect(applyButton()).toHaveTextContent('Apply 2 replies')

    await user.click(within(bar()).getByRole('button', { name: 'Clear' }))

    expect(queryBar()).toBeNull()
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67 123 45 67')
    expect(within(card(SKILLS)).getByRole('button', { name: 'Kafka' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('Applying', () => {
  test('sends every reply in one request, in the order of the list', async () => {
    const { cv, user } = await openQuestions()
    const { sent, bodies } = requests()
    const ids = cv.questions.map((question) => question.id)

    await user.click(within(card(SKILLS)).getByRole('button', { name: 'Kafka' }))
    await user.type(within(card(SKILLS)).getByLabelText('Other, comma-separated'), 'NATS, Go')
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'Answer' }))
    await user.click(within(card(CLAIM)).getByRole('button', { name: 'Yes, add it' }))
    await user.click(within(card(ENGLISH)).getByRole('button', { name: 'Skip' }))
    await answerPhone(user)
    await user.click(applyButton())

    expect(await screen.findByText('No open questions.', { exact: false })).toBeVisible()
    await noticeSays('4 replies applied')
    expect(sent).toEqual([`POST /api/cvs/${cv.id}/replies`])
    expect(await bodies[0]).toEqual({
      replies: [
        { questionId: ids[0], answer: { kind: 'text', value: '+380 67 123 45 67' } },
        { questionId: ids[1], answer: null },
        { questionId: ids[2], answer: { kind: 'multi', values: ['Kafka'], other: 'NATS, Go' } },
        { questionId: ids[3], answer: { kind: 'confirm', value: true } },
      ],
    })

    expect(screen.getByLabelText(/^Phone/)).toHaveValue('+380 67 123 45 67')
    const chips = screen.getByRole('list', { name: 'Your skills' })
    expect(within(chips).getByText('Kafka')).toBeVisible()
    expect(within(chips).getByText('NATS')).toBeVisible()
    expect(within(chips).getByText('Go')).toBeVisible()
    expect(within(chips).queryByText('gRPC')).toBeNull()
    const job = screen.getByRole('group', { name: 'Job 1' })
    expect((within(job).getByLabelText('What you did') as HTMLTextAreaElement).value).toContain(
      'Cut payment latency by 40% with a read-through Redis cache',
    )
    const level = within(screen.getByRole('group', { name: 'Language 2' })).getByLabelText(/^Level/)
    expect(level).toHaveValue('')

    expect(queryCard(PHONE)).toBeNull()
    expect(queryBar()).toBeNull()
    expect(screen.getByText('Ready')).toBeVisible()
    expect(tab(/^Questions$/)).toBeVisible()
    await user.click(answered())
    expect(screen.getByText('+380 67 123 45 67', { selector: 'p' })).toBeVisible()
    expect(screen.getByText('Skipped')).toBeVisible()
    expect(stored(cv.id).version).toBe(cv.version + 1)
    expect(stored(cv.id).questions.find((q) => q.label === 'Skills')?.answer).toEqual([
      'Kafka',
      'NATS',
      'Go',
    ])
  })

  test('a choice answer fills its field, and the other questions stay open', async () => {
    const { cv, user } = await openQuestions()

    await user.click(within(card(ENGLISH)).getByRole('button', { name: 'C1' }))
    await user.click(within(card(ENGLISH)).getByRole('button', { name: 'Answer' }))
    await user.click(applyButton())

    await tabShows('Questions · 3')
    await noticeSays('1 reply applied')
    const level = within(screen.getByRole('group', { name: 'Language 2' })).getByLabelText(/^Level/)
    expect(level).toHaveValue('C1')
    expect(stored(cv.id).questions.find((q) => q.label === 'English')?.answer).toBe('C1')
    expect(card(PHONE)).toBeVisible()
    expect(queryCard(ENGLISH)).toBeNull()
    expect(screen.getByText('Needs your answers')).toBeVisible()
  })

  test('No leaves the claim out', async () => {
    const { user } = await openQuestions()

    await user.click(within(card(CLAIM)).getByRole('button', { name: 'No' }))
    await user.click(applyButton())

    await tabShows('Questions · 3')
    const job = screen.getByRole('group', { name: 'Job 1' })
    expect((within(job).getByLabelText('What you did') as HTMLTextAreaElement).value).not.toContain(
      'Cut payment latency',
    )
  })

  test('says that the CV is being updated while the request runs, and locks the rest', async () => {
    const { user } = await openQuestions()
    let release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    // Holds the request until released, then falls through to the mock handler.
    server.use(
      http.post('/api/cvs/:id/replies', async () => {
        await gate
      }),
    )

    // Keyboard only: type, Enter on Answer, Enter on Change, Enter on Answer, Enter on Apply.
    await user.click(within(card(PHONE)).getByLabelText('Your answer'))
    await user.keyboard('+380 67 123 45 67')
    within(card(PHONE)).getByRole('button', { name: 'Answer' }).focus()
    await user.keyboard('{Enter}')
    expect(within(card(PHONE)).getByText('+380 67 123 45 67')).toBeVisible()
    within(card(PHONE)).getByRole('button', { name: 'Change' }).focus()
    await user.keyboard('{Enter}')
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67 123 45 67')
    within(card(PHONE)).getByRole('button', { name: 'Answer' }).focus()
    await user.keyboard('{Enter}')
    applyButton().focus()
    await user.keyboard('{Enter}')

    const status = await within(bar()).findByText('Updating your CV…')
    expect(status.closest('[aria-live="polite"]')).not.toBeNull()
    expect(within(bar()).getByRole('button', { name: /^Apply/ })).toBeDisabled()
    expect(within(bar()).getByRole('button', { name: 'Clear' })).toBeDisabled()
    expect(within(card(SKILLS)).getByRole('button', { name: 'Answer' })).toBeDisabled()
    expect(within(card(CLAIM)).getByRole('button', { name: 'Yes, add it' })).toBeDisabled()
    expect(within(card(SKILLS)).getByRole('button', { name: 'Kafka' })).toBeDisabled()
    expect(within(card(SKILLS)).getByLabelText('Other, comma-separated')).toBeDisabled()
    expect(within(card(ENGLISH)).getByRole('button', { name: 'C1' })).toBeDisabled()
    expect(screen.getByLabelText('About you')).toBeDisabled()

    release()
    await tabShows('Questions · 3')
    await noticeSays('1 reply applied')
    expect(screen.getByLabelText('About you')).toBeEnabled()
    expect(within(card(SKILLS)).getByRole('button', { name: 'Kafka' })).toBeEnabled()
  })
})

describe('Applying and unsaved edits', () => {
  test('unsaved edits are saved before the batch is sent', async () => {
    const { cv, user } = await openQuestions()
    const { sent } = requests()

    await user.type(screen.getByLabelText('About you'), ' More.')
    await answerSkills(user)
    await user.click(applyButton())

    await tabShows('Questions · 3')
    expect(sent).toEqual([`PATCH /api/cvs/${cv.id}`, `POST /api/cvs/${cv.id}/replies`])
    expect(screen.getByLabelText('About you')).toHaveValue(`${cv.data!.summary} More.`)
  })

  test('when that save fails nothing is sent and the replies stay', async () => {
    const { user } = await openQuestions()
    const { sent } = requests()
    server.use(http.patch('/api/cvs/:id', () => HttpResponse.json(null, { status: 503 })))

    await user.type(screen.getByLabelText('About you'), ' More.')
    await answerSkills(user)
    await user.click(applyButton())

    await barSays('Not applied: your edits could not be saved. Save them, then apply again.')
    expect(sent.filter((request) => request.startsWith('POST'))).toEqual([])
    expect(within(card(SKILLS)).getByText('Kafka')).toBeVisible()
    expect(applyButton()).toHaveTextContent('Apply 1 reply')
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

  test('a save that closes a replied question leaves that reply out of the batch', async () => {
    const { cv, user } = await openQuestions()
    const { sent, bodies } = requests()

    await user.click(within(card(CLAIM)).getByRole('button', { name: 'Yes, add it' }))
    await answerPhone(user)
    await user.click(
      within(screen.getByRole('group', { name: 'Job 1' })).getByRole('button', { name: 'Remove' }),
    )
    await user.click(applyButton())

    await tabShows('Questions · 2')
    await noticeSays('1 reply applied')
    expect(sent).toEqual([`PATCH /api/cvs/${cv.id}`, `POST /api/cvs/${cv.id}/replies`])
    expect(await bodies[0]).toEqual({
      replies: [
        { questionId: cv.questions[0]!.id, answer: { kind: 'text', value: '+380 67 123 45 67' } },
      ],
    })
  })
})

describe('A failed batch', () => {
  test('a question closed elsewhere drops its reply and keeps the others', async () => {
    const { cv, user } = await openQuestions()
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.questions[0]!.status = 'skipped'
      entry.cv.version += 1
    })

    await answerPhone(user)
    await answerSkills(user)
    await user.click(applyButton())

    await barSays(QUESTIONS_CHANGED)
    await tabShows('Questions · 3')
    expect(queryCard(PHONE)).toBeNull()
    expect(within(card(SKILLS)).getByText('Kafka')).toBeVisible()
    expect(applyButton()).toHaveTextContent('Apply 1 reply')

    await user.click(applyButton())
    await tabShows('Questions · 2')
    await noticeSays('1 reply applied')
    expect(
      within(screen.getByRole('list', { name: 'Your skills' })).getByText('Kafka'),
    ).toBeVisible()
  })

  test('a question about a job removed elsewhere refreshes the CV and says why', async () => {
    const { cv, user } = await openQuestions()
    // As the server does when a save removes an item: the job goes, its question is skipped.
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.data!.experience.shift()
      entry.cv.questions[3]!.status = 'skipped'
      entry.cv.version += 1
    })

    await user.click(within(card(CLAIM)).getByRole('button', { name: 'Yes, add it' }))
    await user.click(applyButton())

    await barSays(QUESTIONS_CHANGED)
    await tabShows('Questions · 3')
    expect(screen.queryByRole('group', { name: 'Job 2' })).toBeNull()
    expect(queryCard(CLAIM)).toBeNull()
    // Nothing is left to apply; Clear dismisses the notice.
    expect(within(bar()).getByRole('button', { name: /^Apply/ })).toBeDisabled()
    await user.click(within(bar()).getByRole('button', { name: 'Clear' }))
    expect(queryBar()).toBeNull()
  })

  test('a refused reply opens its card again with the message; the rest stay replied', async () => {
    const { user } = await openQuestions()
    server.use(
      http.post('/api/cvs/:id/replies', () =>
        errorResponse(400, 'VALIDATION_ERROR', 'The request is invalid.', {
          details: { fields: { 'replies.0.answer.value': 'Too long for a phone number' } },
        }),
      ),
    )

    await answerSkills(user)
    await answerPhone(user)
    await user.click(applyButton())

    await barSays('Not applied: check the marked replies and apply again.')
    expect(within(card(PHONE)).getByRole('alert')).toHaveTextContent('Too long for a phone number')
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67 123 45 67')
    expect(within(card(SKILLS)).getByText('Kafka')).toBeVisible()
    expect(applyButton()).toHaveTextContent('Apply 1 reply')

    // Replying again drops the message and the notice.
    await user.click(within(card(PHONE)).getByRole('button', { name: 'Answer' }))
    expect(within(card(PHONE)).queryByRole('alert')).toBeNull()
    expect(within(bar()).queryByRole('alert')).toBeNull()
    expect(applyButton()).toHaveTextContent('Apply 2 replies')
  })

  test('a server error keeps every reply to try again', async () => {
    const { user } = await openQuestions()
    server.use(
      http.post('/api/cvs/:id/replies', () => HttpResponse.json(null, { status: 503 }), {
        once: true,
      }),
    )

    await user.type(screen.getByLabelText('About you'), ' More.')
    await answerPhone(user, '+380 67')
    await answerSkills(user)
    await user.click(applyButton())

    // The save before the batch remounts the form; the replies and the edits are still there.
    await barSays(/^Not applied\. Cannot reach the server/)
    expect(within(card(PHONE)).getByText('+380 67')).toBeVisible()
    expect(within(card(SKILLS)).getByText('Kafka')).toBeVisible()
    expect((screen.getByLabelText('About you') as HTMLTextAreaElement).value).toMatch(/ More\.$/)

    await user.click(applyButton())
    await tabShows('Questions · 2')
    await noticeSays('2 replies applied')
  })
})

describe('Replies kept in the browser', () => {
  test('a reload restores the replied cards, the count and the drafts', async () => {
    const { cv, owner, user } = await openQuestions()

    await answerPhone(user)
    await user.click(within(card(ENGLISH)).getByRole('button', { name: 'Skip' }))
    await user.click(within(card(SKILLS)).getByRole('button', { name: 'Kafka' }))
    expect(localStorage.getItem(storedRepliesKey(owner.id, cv.id))).not.toBeNull()

    renderApp(`/cvs/${cv.id}?tab=questions`)
    await screen.findByLabelText('CV title')

    expect(within(card(PHONE)).getByText('+380 67 123 45 67')).toBeVisible()
    expect(within(card(ENGLISH)).getByText('Skipped')).toBeVisible()
    expect(applyButton()).toHaveTextContent('Apply 2 replies')
    expect(within(card(SKILLS)).getByRole('button', { name: 'Kafka' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(within(card(PHONE)).getByRole('button', { name: 'Change' }))
    expect(within(card(PHONE)).getByLabelText('Your answer')).toHaveValue('+380 67 123 45 67')
  })

  test('a reply to a question closed meanwhile is not restored', async () => {
    const { cv, user } = await openQuestions()

    await answerPhone(user)
    await answerSkills(user)
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv.questions[0]!.status = 'skipped'
      entry.cv.version += 1
    })

    renderApp(`/cvs/${cv.id}?tab=questions`)
    await screen.findByLabelText('CV title')

    expect(queryCard(PHONE)).toBeNull()
    expect(within(card(SKILLS)).getByText('Kafka')).toBeVisible()
    expect(applyButton()).toHaveTextContent('Apply 1 reply')
  })

  test('the stored replies go once applied', async () => {
    const { cv, owner, user } = await openQuestions()
    const key = storedRepliesKey(owner.id, cv.id)

    await answerPhone(user)
    expect(localStorage.getItem(key)).not.toBeNull()
    await user.click(applyButton())

    await tabShows('Questions · 3')
    expect(localStorage.getItem(key)).toBeNull()
  })

  test('deleting the CV forgets its replies', async () => {
    const { cv, owner, user } = await openQuestions()
    const key = storedRepliesKey(owner.id, cv.id)

    await answerPhone(user)
    expect(localStorage.getItem(key)).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete for good' }))

    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeVisible()
    expect(localStorage.getItem(key)).toBeNull()
  })

  test('logging out forgets the replies kept in this browser', async () => {
    const { cv, owner, user } = await openQuestions()
    const key = storedRepliesKey(owner.id, cv.id)

    await answerPhone(user)
    expect(localStorage.getItem(key)).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
    expect(localStorage.getItem(key)).toBeNull()
  })

  test('a blocked storage still lets the user reply and apply', async () => {
    const blocked = (key: string) => {
      if (key.startsWith('cv-replies:')) throw new DOMException('Blocked', 'SecurityError')
    }
    const getItem = Storage.prototype.getItem
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
      blocked(key)
      return getItem.call(this, key)
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      blocked(key)
      setItem.call(this, key, value)
    })
    onTestFinished(() => {
      vi.restoreAllMocks()
    })
    const { user } = await openQuestions()

    await answerPhone(user)
    expect(within(card(PHONE)).getByText('+380 67 123 45 67')).toBeVisible()
    await user.click(applyButton())

    await tabShows('Questions · 3')
    await noticeSays('1 reply applied')
    expect(screen.getByLabelText(/^Phone/)).toHaveValue('+380 67 123 45 67')
  })
})
