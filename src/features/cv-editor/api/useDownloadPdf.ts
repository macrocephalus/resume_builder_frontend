import { useMutation } from '@tanstack/react-query'
import { apiFile } from '@/shared/api/client'
import { apiPaths } from '@/shared/config/paths'
import { saveFile } from '@/shared/lib/saveFile'

/** Fetches the PDF of the saved draft and hands it to the browser's downloads. */
export function useDownloadPdf(cvId: string) {
  return useMutation({
    mutationFn: async () => {
      const file = await apiFile(apiPaths.cvPdf(cvId), {
        type: 'application/pdf',
        fallbackName: 'cv.pdf',
      })
      saveFile(file.blob, file.name)
    },
  })
}
