import { API_LIMITS } from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { extractedCvText, longCvText, shortCvText } from '@/mocks/fixtures/source'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { errorResponse } from '@/mocks/respond'

const PDF_MAGIC = '%PDF'

/** The text a PDF "holds", picked by a word in its name, and how many pages it has. */
function extractFrom(filename: string): { text: string; pages: number } {
  const name = filename.toLowerCase()
  if (name.includes('long')) return { text: longCvText, pages: 9 }
  if (name.includes('short')) return { text: shortCvText, pages: 1 }
  return { text: extractedCvText, pages: 2 }
}

/**
 * Returns a fixture text for any PDF, but checks the file for real: the `%PDF` magic bytes
 * (`415`) and the size (`413`). A word in the filename picks the case: "scan" is a PDF without
 * text (`422`); "long" one with more text than a CV can start from, "short" one with less, both
 * read as the API reads them, since it checks only its own minimum of 50 characters.
 */
export const ingestHandlers = [
  http.post('/api/ingest/pdf', async ({ request }) => {
    if (!sessionUser()) return unauthorized()
    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!file || typeof file === 'string') {
      return errorResponse(400, 'VALIDATION_ERROR', 'Attach a file.', {
        details: { fields: { file: 'Required' } },
      })
    }
    if (file.size > API_LIMITS.pdf.bytes) {
      return errorResponse(413, 'INPUT_TOO_LARGE', 'The PDF is larger than 5 MB.')
    }
    const head = new TextDecoder().decode(await file.slice(0, PDF_MAGIC.length).arrayBuffer())
    if (head !== PDF_MAGIC) return errorResponse(415, 'UNSUPPORTED_FILE', 'This file is not a PDF.')
    if (file.name.toLowerCase().includes('scan')) {
      return errorResponse(422, 'PDF_UNREADABLE', 'The PDF has no text layer.')
    }
    const { text, pages } = extractFrom(file.name)
    return HttpResponse.json({ text, pages, chars: text.length, filename: file.name })
  }),
]
