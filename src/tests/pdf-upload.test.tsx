import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test } from 'vitest'
import { server } from '@/mocks/server'
import { seedUser } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

const pdf = (name = 'olena-cv.pdf', body = '%PDF-1.7 a CV') =>
  new File([body], name, { type: 'application/pdf' })

async function openForm() {
  signedIn()
  renderApp('/cvs/new')
  const upload = await screen.findByLabelText('Upload PDF')
  return { user: userEvent.setup({ applyAccept: false }), upload }
}

describe('PDF upload', () => {
  test('fills the text area with the extracted text and says how much was read', async () => {
    const { user, upload } = await openForm()

    await user.upload(upload, pdf())

    expect(
      await screen.findByText(/Extracted \d[\d ]* characters from 2 pages of olena-cv.pdf/),
    ).toBeVisible()
    expect((screen.getByLabelText('Your experience') as HTMLTextAreaElement).value).toContain(
      'Senior Backend Engineer, Fintory',
    )
  })

  test('creates the CV with the PDF as its source', async () => {
    const { user, upload } = await openForm()
    let body: unknown
    const listener = async ({ request }: { request: Request }) => {
      if (request.method === 'POST' && new URL(request.url).pathname === '/api/cvs') {
        body = await request.clone().json()
      }
    }
    server.events.on('request:start', listener)
    onTestFinished(() => server.events.removeListener('request:start', listener))

    await user.upload(upload, pdf())
    await screen.findByText(/Extracted/)
    await user.type(screen.getByLabelText('Target role'), 'Senior Backend Engineer')
    await user.click(screen.getByRole('button', { name: 'Create CV' }))

    await screen.findByText('Starting soon')
    expect(body).toMatchObject({ sourceType: 'pdf', sourceFilename: 'olena-cv.pdf' })
  })

  test('says what to do when the text of a PDF is too long for a CV', async () => {
    const { user, upload } = await openForm()

    await user.upload(upload, pdf('long-cv.pdf'))

    expect(
      await screen.findByText(
        /more than the 20 000 a CV can start from\. Shorten the text below to fit: keep your recent roles and cut what is old or repeated\./,
      ),
    ).toBeVisible()
    expect(screen.getByLabelText('Your experience')).toHaveAccessibleDescription(
      expect.stringContaining('Use at most 20 000 characters'),
    )
  })

  test('says what to do when a PDF has too little text for a CV', async () => {
    const { user, upload } = await openForm()

    await user.upload(upload, pdf('short-cv.pdf'))

    expect(
      await screen.findByText(
        /^Extracted only \d+ characters from 1 page of short-cv\.pdf, fewer than the 80 a CV needs\. Add more below: roles, companies, dates, what you did\.$/,
      ),
    ).toBeVisible()
  })

  test('asks before it replaces text the user already typed', async () => {
    const { user, upload } = await openForm()
    const text = screen.getByLabelText('Your experience')
    await user.type(text, 'My own words')

    await user.upload(upload, pdf())
    const ask = await screen.findByText(/Replace the text below with the/)
    expect(text).toHaveValue('My own words')

    expect(ask).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Keep my text' }))
    expect(text).toHaveValue('My own words')

    await user.upload(upload, pdf())
    await user.click(await screen.findByRole('button', { name: 'Replace' }))
    expect((text as HTMLTextAreaElement).value).toContain('Senior Backend Engineer, Fintory')
  })

  test.each([
    ['a file that is not a PDF', new File(['hello'], 'notes.pdf'), 'This file is not a PDF.'],
    [
      'a PDF over 5 MB',
      pdf('big.pdf', `%PDF${'x'.repeat(5 * 1024 * 1024)}`),
      'This PDF is too large: up to 5 MB and 10 pages. Paste the text below instead.',
    ],
    [
      'a scan without text',
      pdf('passport-scan.pdf'),
      'it may be a scan. Paste your text below instead.',
    ],
  ])('explains %s next to the upload', async (_, file, message) => {
    const { user, upload } = await openForm()

    await user.upload(upload, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('Your experience')).toHaveValue('')
  })

  test('says when uploads are throttled', async () => {
    server.use(
      http.post('/api/ingest/pdf', () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Slow down', details: {} } },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    )
    const { user, upload } = await openForm()

    await user.upload(upload, pdf())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many uploads. Try again in 1 minute.',
    )
  })
})
