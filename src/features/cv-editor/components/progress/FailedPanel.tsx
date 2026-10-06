import type { Cv } from '@cv/shared'
import { Button } from '@/shared/ui/Button'
import { Notice } from '@/shared/ui/Notice'
import { Panel } from '@/shared/ui/Panel'
import { useRetryCv } from '@/entities/cv/api/useRetryCv'
import { retryErrorText } from '@/entities/cv/model/usage'
import { CvHeader } from '@/features/cv-editor/components/CvHeader'
import { DeleteCv } from '@/features/cv-editor/components/DeleteCv'

/** A CV whose generation failed for good: what went wrong, Retry and Delete. */
export function FailedPanel({ cv }: { cv: Cv }) {
  const retry = useRetryCv()

  return (
    <Panel className="flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <CvHeader cv={cv} />
      <Notice tone="bad">{cv.error ?? 'The CV could not be generated.'}</Notice>
      <p>Your text is kept, so Retry starts again without asking for it.</p>
      <div className="flex flex-wrap items-start gap-2">
        <Button pending={retry.isPending} onClick={() => retry.mutate(cv.id)}>
          Retry
        </Button>
        <DeleteCv cvId={cv.id} />
      </div>
      {retry.isError ? (
        <Notice tone="bad" role="alert">
          Could not retry. {retryErrorText(retry.error)}
        </Notice>
      ) : null}
    </Panel>
  )
}
