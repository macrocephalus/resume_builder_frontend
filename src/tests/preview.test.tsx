import { DEFAULT_SECTION_ORDER, type Cv } from '@cv/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { readDb, seedUser } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'
import { wideScreen } from '@/tests/wideScreen'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

/**
 * A ready CV with a small draft: summary, one job and two skills. Tests run at phone width, so
 * the preview shows on its own panel.
 */
async function openCv(overrides: Partial<Cv> = {}, path = '?tab=preview') {
  const cv = seedCv(signedIn(), 'ready', { title: 'Olena — Backend', ...overrides })
  renderApp(`/cvs/${cv.id}${path}`)
  await screen.findByLabelText('CV title')
  return { cv, user: userEvent.setup() }
}

const preview = () => screen.getByRole('region', { name: 'Preview' })
const sheetHeadings = () =>
  within(preview())
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
/** The editor's blocks below Contacts, in the order shown. */
const editorBlocks = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
    .filter((name) => name !== 'Contacts' && name !== 'Preview')

describe('Preview', () => {
  test('shows the draft as a sheet: name, contacts, then the blocks with content', async () => {
    await openCv()

    expect(within(preview()).getByText('Olena Hnatiuk')).toBeVisible()
    expect(within(preview()).getByText('olena@example.com · Kyiv')).toBeVisible()
    expect(sheetHeadings()).toEqual(['Summary', 'Experience', 'Skills'])
    expect(within(preview()).getByText('Backend Engineer, Fintory')).toBeVisible()
    expect(within(preview()).getByText('Node.js, PostgreSQL')).toBeVisible()
  })

  test('follows unsaved edits', async () => {
    const { user } = await openCv()

    const name = screen.getByLabelText(/^Full name/)
    await user.clear(name)
    await user.type(name, 'Olena H.')

    expect(await within(preview()).findByText('Olena H.')).toBeVisible()
    await user.clear(screen.getByLabelText('About you'))
    await waitFor(() => expect(sheetHeadings()).toEqual(['Experience', 'Skills']))
  })

  test('a draft with only a name shows no block headings', async () => {
    const data = {
      contacts: { fullName: 'Olena', email: null, phone: null, location: null, links: [] },
      summary: null,
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      skills: [],
      languages: [],
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    }
    await openCv({ data })

    expect(within(preview()).getByText('Olena')).toBeVisible()
    expect(sheetHeadings()).toEqual([])
  })

  test('uses the headings of the CV language', async () => {
    await openCv({ language: 'uk' })

    expect(sheetHeadings()).toEqual(['Профіль', 'Досвід роботи', 'Навички'])
  })
})

describe('Block order', () => {
  test('moving a block reorders the editor and the preview, and is saved', async () => {
    const { cv, user } = await openCv()

    const skills = screen.getByRole('region', { name: 'Skills' })
    // From sixth place to second, right after Summary.
    for (let step = 0; step < 4; step++) {
      await user.click(within(skills).getByRole('button', { name: 'Move block up' }))
    }

    expect(editorBlocks().slice(0, 3)).toEqual(['Summary', 'Skills', 'Experience'])
    expect(await within(preview()).findAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(sheetHeadings()).toEqual(['Summary', 'Skills', 'Experience'])

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved ✓')
    expect(readDb().cvs[0]?.cv.data?.sectionOrder.slice(0, 3)).toEqual([
      'summary',
      'skills',
      'experience',
    ])

    renderApp(`/cvs/${cv.id}?tab=preview`)
    await screen.findByLabelText('CV title')
    expect(sheetHeadings()).toEqual(['Summary', 'Skills', 'Experience'])
    expect(editorBlocks().slice(0, 3)).toEqual(['Summary', 'Skills', 'Experience'])
  })

  test('the first block cannot move up and the last cannot move down', async () => {
    await openCv()

    expect(
      within(screen.getByRole('region', { name: 'Summary' })).getByRole('button', {
        name: 'Move block up',
      }),
    ).toBeDisabled()
    expect(
      within(screen.getByRole('region', { name: 'Languages' })).getByRole('button', {
        name: 'Move block down',
      }),
    ).toBeDisabled()
  })
})

describe('Panels', () => {
  test('the panel switch is kept in the URL, so a reload opens the same panel', async () => {
    const { cv, user } = await openCv({}, '')
    const tabs = screen.getByRole('group', { name: 'Panel' })

    expect(within(tabs).getByRole('button', { name: 'Edit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(within(tabs).getByRole('button', { name: 'Preview' }))
    expect(window.location.search).toBe('?tab=preview')
    expect(within(tabs).getByRole('button', { name: 'Preview' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    renderApp(`/cvs/${cv.id}?tab=preview`)
    await screen.findByLabelText('CV title')
    expect(
      within(screen.getByRole('group', { name: 'Panel' })).getByRole('button', {
        name: 'Preview',
      }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(window.location.search).toBe('')
  })

  test('switching panels with unsaved edits keeps them and does not ask', async () => {
    const { user } = await openCv({}, '')

    await user.type(screen.getByLabelText('About you'), ' More.')
    await user.click(screen.getByRole('button', { name: 'Preview' }))

    expect(screen.queryByText('Leave without saving?')).toBeNull()
    expect(screen.getByLabelText('About you')).toHaveValue(
      'Backend engineer with six years of Node.js and PostgreSQL. More.',
    )
  })

  test('a save that fails validation on the Preview panel goes back to the editor', async () => {
    const { user } = await openCv({}, '')

    await user.click(screen.getByLabelText(/^Full name/))
    await user.paste('x'.repeat(201))
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.location.search).toBe('')
    expect(screen.getByText('Not saved: fix the marked fields first.')).toBeVisible()
    expect(screen.getByLabelText(/^Full name/)).toHaveAccessibleDescription(
      'Use at most 200 characters',
    )
  })

  test('an unknown panel in the URL opens the editor', async () => {
    await openCv({}, '?tab=nonsense')

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('region', { name: 'Preview' })).toBeNull()
  })

  test('from 980 px the editor and the preview sit side by side, with no switch', async () => {
    wideScreen()
    await openCv({}, '')

    expect(screen.getByRole('region', { name: 'Contacts' })).toBeVisible()
    expect(preview()).toBeVisible()
    expect(screen.queryByRole('group', { name: 'Panel' })).toBeNull()
  })
})
