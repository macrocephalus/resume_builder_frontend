import type { Cv } from '@cv/shared'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { generatedDraft } from '@/mocks/fixtures/draft'
import { server } from '@/mocks/server'
import { seedUser } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'
import { wideScreen } from '@/tests/wideScreen'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

/** A ready CV whose draft covers Node.js, but not Kubernetes. */
async function openCv(path = '?tab=match', overrides: Partial<Cv> = {}) {
  const owner = signedIn()
  const cv = seedCv(owner, 'ready', { title: 'Olena — Backend', ...overrides })
  renderApp(`/cvs/${cv.id}${path}`)
  await screen.findByLabelText('CV title')
  return { owner, user: userEvent.setup() }
}

const group = (name: string) => screen.getByRole('list', { name })
const rows = (name: string) =>
  within(group(name))
    .getAllByRole('listitem')
    .map((row) => row.textContent)

/** Every request the app sends during the test. */
function requests() {
  const sent: string[] = []
  const listener = ({ request }: { request: Request }) => {
    sent.push(`${request.method} ${new URL(request.url).pathname}`)
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return sent
}

describe('Match', () => {
  test('the header bar and the Match panel show what the role asks for and where it is', async () => {
    await openCv()

    expect(screen.getByRole('meter', { name: 'Covers 1 of 2 requirements' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
    expect(rows('Missing (1)')).toEqual(['KubernetesAdd it to your skills if you have it.'])
    expect(rows('Covered (1)')).toEqual(['Node.jsFound in summary, experience and skills'])
  })

  test('typing a missing keyword into a bullet covers its requirement, with no request', async () => {
    const { user } = await openCv('')
    const sent = requests()

    await user.type(screen.getByLabelText('What you did'), '\nRan the services on k8s')

    expect(await screen.findByRole('meter', { name: 'Covers 2 of 2 requirements' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Match' }))
    expect(await screen.findByText('The CV covers every requirement of the role.')).toBeVisible()
    expect(rows('Covered (2)')).toContain('KubernetesFound in experience')
    expect(sent).toEqual([])
  })

  test('answering a question covers the requirement it was about', async () => {
    const { user } = await openCv('?tab=questions', {
      status: 'needs_input',
      ...generatedDraft({ withQuestions: true }),
    })
    expect(screen.getByRole('meter', { name: 'Covers 4 of 5 requirements' })).toBeVisible()

    const skills = screen.getByRole('region', {
      name: 'Which of these have you worked with? Only what you tick goes into the CV.',
    })
    await user.click(within(skills).getByRole('button', { name: 'Kubernetes' }))
    await user.click(within(skills).getByRole('button', { name: 'Answer' }))
    await user.click(screen.getByRole('button', { name: 'Apply 1 reply' }))

    expect(await screen.findByRole('meter', { name: 'Covers 5 of 5 requirements' })).toBeVisible()
  })

  test('a missing experience requirement asks the user, and nothing is added for them', async () => {
    await openCv('?tab=match', {
      requirements: [
        {
          id: crypto.randomUUID(),
          label: 'Event-driven systems',
          kind: 'experience',
          keywords: ['kafka', 'event-driven'],
        },
      ],
    })

    expect(rows('Missing (1)')).toEqual(['Event-driven systemsAdd it in the editor if it’s true.'])
    expect(within(screen.getByRole('region', { name: 'Match' })).queryByRole('button')).toBeNull()
  })

  test('from 980 px Match is a side tab next to the editor', async () => {
    wideScreen()
    const { user } = await openCv('')

    const panels = screen.getByRole('group', { name: 'Panel' })
    expect(
      within(panels)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Match', 'Preview'])

    await user.click(within(panels).getByRole('button', { name: 'Match' }))
    expect(await screen.findByRole('region', { name: 'Match' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Contacts' })).toBeVisible()
  })

  test('a CV whose role has no requirements has no match bar and no Match tab', async () => {
    await openCv('', { requirements: [] })

    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Match' })).toBeNull()
  })

  test('My CVs shows the same figure, and none for a role without requirements', async () => {
    const { owner } = await openCv()
    seedCv(owner, 'ready', { title: 'No requirements', requirements: [] })
    renderApp('/')

    expect(await screen.findByText('Match 1/2')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'No requirements' })).toBeVisible()
    expect(screen.queryByText('Match 0/0')).toBeNull()
  })
})
