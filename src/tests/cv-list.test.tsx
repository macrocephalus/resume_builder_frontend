import type { CvStatus } from '@cv/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { seedCv } from '@/mocks/fixtures/cv'
import { server } from '@/mocks/server'
import { expireSession, seedUser } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

const row = (title: string) => screen.getByRole('listitem', { name: title })

describe('My CVs', () => {
  test('a new account sees what it needs to start, with a link to New CV', async () => {
    signedIn()
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeVisible()
    expect(screen.getByText(/a PDF of your CV or a few lines in your own words/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create your first CV' })).toHaveAttribute(
      'href',
      '/cvs/new',
    )
  })

  test.each<[CvStatus, string, string[]]>([
    ['queued', 'In queue', ['Watch progress', 'Delete']],
    ['generating', 'Generating', ['Watch progress', 'Delete']],
    ['retrying', 'Retrying', ['Watch progress', 'Delete']],
    ['failed', 'Failed', ['Retry', 'Delete']],
    ['needs_input', 'Needs your answers', ['Open', 'Delete']],
    ['ready', 'Ready', ['Open', 'Delete']],
  ])('a %s CV shows "%s" and its actions', async (status, label, actions) => {
    const cv = seedCv(signedIn(), status, { title: 'Olena — Backend' })
    renderApp('/')

    await screen.findByRole('heading', { name: 'Olena — Backend' })
    const item = row('Olena — Backend')
    expect(within(item).getByText(label)).toBeVisible()
    const controls = within(item)
      .queryAllByRole('link')
      .concat(within(item).queryAllByRole('button'))
      .map((control) => control.textContent)
    expect(controls.sort()).toEqual([...actions].sort())
    for (const link of within(item).queryAllByRole('link')) {
      expect(link).toHaveAttribute('href', `/cvs/${cv.id}`)
    }
  })

  test('a row shows the target role, open questions, match and the last update', async () => {
    const cv = seedCv(signedIn(), 'needs_input', {
      title: 'Olena — Backend',
      targetRole: 'Senior Backend Engineer',
      updatedAt: '2026-10-05T09:30:00.000Z',
    })
    renderApp('/')

    await screen.findByRole('heading', { name: 'Olena — Backend' })
    const item = row('Olena — Backend')
    expect(within(item).getByText('Senior Backend Engineer')).toBeVisible()
    expect(within(item).getByText('2 open questions')).toBeVisible()
    expect(within(item).getByText('Match 1/2')).toBeVisible()
    const time = item.querySelector('time')
    expect(time).toHaveAttribute('dateTime', cv.updatedAt)
    expect(time).toHaveTextContent(
      new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(cv.updatedAt),
      ),
    )
  })

  test("lists the newest first and never another user's CVs", async () => {
    const ann = signedIn()
    const bob = seedUser('bob@example.com', 'correct-horse')
    seedCv(ann, 'ready', { title: 'Older', updatedAt: '2026-10-01T10:00:00.000Z' })
    seedCv(ann, 'ready', { title: 'Newer', updatedAt: '2026-10-04T10:00:00.000Z' })
    seedCv(bob, 'ready', { title: "Bob's CV" })
    renderApp('/')

    await screen.findByRole('heading', { name: 'Newer' })
    const titles = within(screen.getByRole('list', { name: 'My CVs' }))
      .getAllByRole('heading')
      .map((heading) => heading.textContent)
    expect(titles).toEqual(['Newer', 'Older'])
  })

  test('deletes a CV after a second confirmation, and Cancel keeps it', async () => {
    const ann = signedIn()
    seedCv(ann, 'generating', { title: 'Keep me' })
    seedCv(ann, 'ready', { title: 'Delete me' })
    renderApp('/')
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Delete me' })

    await user.click(within(row('Keep me')).getByRole('button', { name: 'Delete' }))
    // A second click lands on Cancel, so a double click never deletes.
    expect(within(row('Keep me')).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(within(row('Keep me')).getByRole('button', { name: 'Delete' })).toHaveFocus()

    await user.click(within(row('Delete me')).getByRole('button', { name: 'Delete' }))
    await user.click(within(row('Delete me')).getByRole('button', { name: 'Delete for good' }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete me' })).not.toBeInTheDocument(),
    )
    expect(row('Keep me')).toBeVisible()

    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Keep me' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Delete me' })).not.toBeInTheDocument()
  })

  test('a failed delete shows its error next to the button and keeps the row', async () => {
    seedCv(signedIn(), 'ready', { title: 'Olena — Backend' })
    server.use(
      http.delete('/api/cvs/:id', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
      ),
    )
    renderApp('/')
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Olena — Backend' })

    await user.click(within(row('Olena — Backend')).getByRole('button', { name: 'Delete' }))
    await user.click(
      within(row('Olena — Backend')).getByRole('button', { name: 'Delete for good' }),
    )

    expect(await within(row('Olena — Backend')).findByRole('alert')).toHaveTextContent(
      'Could not delete this CV.',
    )
  })

  test('retries a failed CV from its row', async () => {
    seedCv(signedIn(), 'failed', { title: 'Olena — Backend' })
    renderApp('/')
    await screen.findByRole('heading', { name: 'Olena — Backend' })

    await userEvent
      .setup()
      .click(within(row('Olena — Backend')).getByRole('button', { name: 'Retry' }))

    expect(await within(row('Olena — Backend')).findByText('In queue')).toBeVisible()
    expect(
      within(row('Olena — Backend')).getByRole('link', { name: 'Watch progress' }),
    ).toBeVisible()
  })

  test('a list that fails to load shows the error with Retry', async () => {
    signedIn()
    server.use(
      http.get(
        '/api/cvs',
        () => HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
        {
          once: true,
        },
      ),
    )
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Log out' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeVisible()
  })

  test('a session that ends while the list is open leads to login on the next request', async () => {
    seedCv(signedIn(), 'ready', { title: 'Olena — Backend' })
    renderApp('/')
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Olena — Backend' })

    expireSession()
    await user.click(within(row('Olena — Backend')).getByRole('button', { name: 'Delete' }))
    await user.click(
      within(row('Olena — Backend')).getByRole('button', { name: 'Delete for good' }),
    )

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
    expect(window.location.pathname).toBe('/login')
  })
})
