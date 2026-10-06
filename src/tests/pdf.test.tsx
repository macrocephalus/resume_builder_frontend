import type { Cv, CvData } from '@cv/shared'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { buildCv, seedCv } from '@/mocks/fixtures/cv'
import { generatedDraft } from '@/mocks/fixtures/draft'
import { server } from '@/mocks/server'
import { readDb, seedUser, updateDb } from '@/mocks/store'
import { renderApp } from '@/tests/renderApp'

const signedIn = () => seedUser('ann@example.com', 'correct-horse', { signedIn: true })

/** A ready CV with a complete draft. */
async function openCv(overrides: Partial<Cv> = {}, status: 'ready' | 'needs_input' = 'ready') {
  const cv = seedCv(signedIn(), status, { title: 'Olena — Backend', ...overrides })
  renderApp(`/cvs/${cv.id}`)
  await screen.findByLabelText('CV title')
  return { cv, user: userEvent.setup() }
}

/** The files handed to the browser's downloads: name and contents. */
function downloads() {
  const saved: { name: string; blob: Blob }[] = []
  const blobs = new Map<string, Blob>()
  // jsdom has no object URLs and does not navigate: the link's click is where the file goes.
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      const url = `blob:${blobs.size}`
      blobs.set(url, blob)
      return url
    },
    revokeObjectURL: vi.fn(),
  })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push({ name: this.download, blob: blobs.get(this.href)! })
  })
  onTestFinished(() => {
    click.mockRestore()
    Reflect.deleteProperty(URL, 'createObjectURL')
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  })
  return saved
}

/** The saves and PDF requests the app sends, in order. */
function requests() {
  const sent: string[] = []
  const listener = ({ request }: { request: Request }) => {
    const { pathname } = new URL(request.url)
    if (request.method === 'PATCH' || pathname.endsWith('/pdf')) {
      sent.push(`${request.method} ${pathname}`)
    }
  }
  server.events.on('request:start', listener)
  onTestFinished(() => server.events.removeListener('request:start', listener))
  return sent
}

const storedCv = (id: string) => readDb().cvs.find((entry) => entry.cv.id === id)!.cv
const button = (name: string | RegExp) => screen.getByRole('button', { name })

describe('PDF download', () => {
  test('downloads an A4 PDF named after the CV title', async () => {
    const saved = downloads()
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    // Holds the request, then lets it through to the mock handler.
    server.use(http.get('/api/cvs/:id/pdf', () => held, { once: true }))
    const { user } = await openCv()

    await user.click(button('Download PDF'))
    expect(await screen.findByRole('button', { name: 'Preparing PDF…' })).toBeDisabled()
    release()

    await waitFor(() => expect(saved).toHaveLength(1))
    expect(saved[0]!.name).toBe('Olena Backend.pdf')
    expect(saved[0]!.blob.type).toBe('application/pdf')
    expect(await saved[0]!.blob.text()).toMatch(/^%PDF-.*\/MediaBox \[0 0 595\.28 841\.89\]/s)
    expect(await screen.findByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })

  test('with unsaved edits the button saves first, then downloads the saved draft', async () => {
    const saved = downloads()
    const sent = requests()
    const { cv, user } = await openCv()

    await user.type(screen.getByLabelText('About you'), ' Mine.')
    await user.click(button('Save & download'))

    await waitFor(() => expect(saved).toHaveLength(1))
    expect(sent).toEqual([`PATCH /api/cvs/${cv.id}`, `GET /api/cvs/${cv.id}/pdf`])
    expect(storedCv(cv.id).data?.summary).toMatch(/ Mine\.$/)
    // The saved version remounts the form: nothing is unsaved any more.
    expect(await screen.findByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })

  test('a save refused because the CV changed elsewhere stops the download', async () => {
    const saved = downloads()
    const sent = requests()
    const { cv, user } = await openCv()
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv = { ...entry.cv, version: entry.cv.version + 1 }
    })

    await user.type(screen.getByLabelText('About you'), ' Mine.')
    await user.click(button('Save & download'))

    expect(
      await screen.findByText(
        'Not downloaded: your edits could not be saved. The save bar says why.',
      ),
    ).toBeVisible()
    expect(screen.getByText(/Reload the latest version to keep editing/)).toBeVisible()
    expect(sent).toEqual([`PATCH /api/cvs/${cv.id}`])
    expect(saved).toEqual([])
  })

  test('a form with errors is neither saved nor downloaded', async () => {
    const saved = downloads()
    const sent = requests()
    const { user } = await openCv()

    await user.clear(screen.getByLabelText('CV title'))
    await user.click(button('Save & download'))

    expect(
      await screen.findByText('Not downloaded: fix the marked fields in the editor first.'),
    ).toBeVisible()
    expect(screen.getByText('Give the CV a title')).toBeVisible()
    expect(sent).toEqual([])
    expect(saved).toEqual([])
  })

  test('a note lists what the PDF will lack, follows the edits and never blocks', async () => {
    const saved = downloads()
    const data: CvData = { ...buildCv('ready').data!, summary: null, skills: [] }
    const { user } = await openCv({ data })

    expect(
      screen.getByText('Missing from the PDF: summary, skills. You can download it anyway.'),
    ).toBeVisible()

    await user.type(screen.getByLabelText('About you'), 'Backend engineer.')
    expect(
      screen.getByText('Missing from the PDF: skills. You can download it anyway.'),
    ).toBeVisible()

    await user.click(button('Save & download'))
    await waitFor(() => expect(saved).toHaveLength(1))
  })

  test('open questions do not hold up the download, next to what is missing', async () => {
    const saved = downloads()
    const draft = generatedDraft({ withQuestions: true })
    const { user } = await openCv(
      { ...draft, data: { ...draft.data, summary: null } },
      'needs_input',
    )

    expect(screen.getByText('Open questions do not hold up the download.')).toBeVisible()
    expect(
      screen.getByText('Missing from the PDF: summary. You can download it anyway.'),
    ).toBeVisible()
    await user.click(button('Download PDF'))
    await waitFor(() => expect(saved).toHaveLength(1))
  })

  test('a failed download says so next to the button, and Try again fetches it again', async () => {
    const saved = downloads()
    server.use(
      // Anything but a PDF is an error, never a file.
      http.get('/api/cvs/:id/pdf', () => HttpResponse.text('<html>oops</html>'), { once: true }),
    )
    const { user } = await openCv()

    await user.click(button('Download PDF'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Could not download the PDF. Something went wrong.')
    expect(saved).toEqual([])

    await user.click(button('Try again'))
    await waitFor(() => expect(saved).toHaveLength(1))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('a failed download is forgotten once the edits are saved', async () => {
    downloads()
    server.use(http.get('/api/cvs/:id/pdf', () => HttpResponse.error(), { once: true }))
    const { user } = await openCv()

    await user.click(button('Download PDF'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not download the PDF. Cannot reach the server.',
    )

    await user.type(screen.getByLabelText('About you'), ' Mine.')
    await user.click(button('Save'))
    expect(await screen.findByText('Saved ✓')).toBeVisible()
    expect(screen.queryByText(/Could not download the PDF/)).toBeNull()
  })

  test('a CV that lost its draft offers no Try again', async () => {
    downloads()
    const { cv, user } = await openCv()
    updateDb((db) => {
      const entry = db.cvs.find((own) => own.cv.id === cv.id)!
      entry.cv = { ...entry.cv, status: 'failed' }
    })

    await user.click(button('Download PDF'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This CV has no draft to download. Reload the page.',
    )
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  test('a CV without a draft has no download, and mock mode refuses one', async () => {
    const cv = seedCv(signedIn(), 'generating')
    renderApp(`/cvs/${cv.id}`)

    expect(await screen.findByText(/You can close this page/)).toBeVisible()
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull()

    const response = await fetch(new URL(`/api/cvs/${cv.id}/pdf`, window.location.origin))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_STATE' } })
  })
})
