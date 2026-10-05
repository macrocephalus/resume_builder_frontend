import { getCvLanguage, type CvLanguage } from '@cv/shared'
import { useDeferredValue } from 'react'
import { useWatch } from 'react-hook-form'
import { CvSheet } from '@/features/cv-editor/components/preview/CvSheet'
import { toCvData, type DraftFormValues } from '@/features/cv-editor/model/draftForm'
import { toSheet } from '@/features/cv-editor/model/sheet'

/**
 * The live A4 preview of the unsaved form. It renders from a deferred copy of the values, so
 * typing stays responsive and the sheet catches up a moment later.
 */
export function PreviewPanel({ language }: { language: CvLanguage }) {
  const values = useDeferredValue(useWatch<DraftFormValues>() as DraftFormValues)
  const sheet = toSheet(toCvData(values), getCvLanguage(language).headings)

  return (
    <section aria-labelledby="cv-preview-heading">
      <h2 id="cv-preview-heading" className="sr-only">
        Preview
      </h2>
      <CvSheet sheet={sheet} />
    </section>
  )
}
