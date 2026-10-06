import { getCvLanguage, type CvLanguage } from '@cv/shared'
import { useDeferredCvData } from '@/features/cv-editor/components/editor/useDeferredCvData'
import { CvSheet } from '@/features/cv-editor/components/preview/CvSheet'
import { toSheet } from '@/features/cv-editor/model/sheet'

/**
 * The live A4 preview of the unsaved form. It renders from a deferred copy of the values, so
 * typing stays responsive and the sheet catches up a moment later.
 */
export function PreviewPanel({ language }: { language: CvLanguage }) {
  const sheet = toSheet(useDeferredCvData(), getCvLanguage(language).headings)

  return (
    <section aria-labelledby="cv-preview-heading">
      <h2 id="cv-preview-heading" className="sr-only">
        Preview
      </h2>
      <CvSheet sheet={sheet} />
    </section>
  )
}
