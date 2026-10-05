import { API_LIMITS } from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { extractedCvText } from '@/mocks/fixtures/source'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { errorResponse } from '@/mocks/respond'

const PDF_MAGIC = '%PDF'

/**
 * Returns the fixture text for any PDF, but checks the file for real: the `%PDF` magic bytes
 * (`415`) and the size (`413`). A filename with "scan" in it stands for a PDF without text (`422`).
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
    return HttpResponse.json({
      text: extractedCvText,
      pages: 2,
      chars: extractedCvText.length,
      filename: file.name,
    })
  }),
]
