import { API_LIMITS } from '@cv/shared'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { formatWait } from '@/shared/lib/format'

const { bytes, pages } = API_LIMITS.pdf

/** The upload rule, as the hint next to the button says it. */
export const pdfLimits = `up to ${bytes / 1024 / 1024} MB and ${pages} pages`

/** Why a PDF could not be read, and what to do instead. */
export function ingestErrorText(error: unknown): string {
  if (!(error instanceof ApiError)) return errorText(error)
  switch (error.code) {
    case 'UNSUPPORTED_FILE':
      return 'This file is not a PDF. Upload a PDF, or paste your text below.'
    case 'INPUT_TOO_LARGE':
      return `This PDF is too large: ${pdfLimits}. Paste the text below instead.`
    case 'PDF_UNREADABLE':
      return 'This PDF has no text to read; it may be a scan. Paste your text below instead.'
    case 'RATE_LIMITED':
      return `Too many uploads. Try again in ${formatWait(error.retryAfter)}.`
    default:
      return errorText(error)
  }
}
