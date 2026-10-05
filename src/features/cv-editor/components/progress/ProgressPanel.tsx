import type { Cv } from '@cv/shared'
import { Panel } from '@/shared/ui/Panel'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { CvHeader } from '@/features/cv-editor/components/CvHeader'
import { DeleteCv } from '@/features/cv-editor/components/DeleteCv'
import { progressText } from '@/features/cv-editor/model/progressText'

/** A CV in progress. `data-backdrop="drift"` makes the backdrop move while this is on screen. */
export function ProgressPanel({ cv }: { cv: Cv }) {
  return (
    <Panel data-backdrop="drift" className="flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <CvHeader cv={cv} />
      <p aria-live="polite">{progressText(cv)}</p>
      <ProgressBar label="Generating your CV" />
      <p>You can close this page: the CV is generated on the server and waits for you in My CVs.</p>
      <DeleteCv cvId={cv.id} />
    </Panel>
  )
}
