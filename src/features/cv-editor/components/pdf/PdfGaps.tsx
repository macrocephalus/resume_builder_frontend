import { useWatch } from 'react-hook-form'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'
import { pdfGaps } from '@/features/cv-editor/model/pdf'

/**
 * What the PDF will lack, from the values being edited (they are saved before the download), and
 * a word that open questions do not hold the download up. It watches the form on its own, so
 * typing re-renders this note alone. It never blocks the download.
 */
export function PdfGaps({ openQuestions }: { openQuestions: number }) {
  const values = useWatch<DraftFormValues>() as DraftFormValues
  const gaps = pdfGaps(values)

  return (
    <>
      {gaps.length > 0 ? (
        <Notice tone="wait">
          Missing from the PDF: {gaps.join(', ')}. You can download it anyway.
        </Notice>
      ) : null}
      {openQuestions > 0 ? <MetaLine>Open questions do not hold up the download.</MetaLine> : null}
    </>
  )
}
