import { API_LIMITS, ingestPdfResponseSchema } from '@cv/shared'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/ApiError'
import { apiRequest } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'

/** Sends a PDF to the server, which extracts its text and stores nothing. */
export function useIngestPdf() {
  return useMutation({
    mutationFn: (file: File) => {
      // The server would refuse it anyway; this saves sending megabytes over a phone connection.
      if (file.size > API_LIMITS.pdf.bytes) {
        return Promise.reject(new ApiError(413, 'INPUT_TOO_LARGE', 'The PDF is too large.'))
      }
      const body = new FormData()
      body.append('file', file)
      return apiRequest(apiPaths.ingestPdf, ingestPdfResponseSchema, { method: 'POST', body })
    },
  })
}
