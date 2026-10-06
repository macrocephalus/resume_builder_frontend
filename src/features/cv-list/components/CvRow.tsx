import type { CvSummary } from '@cv/shared'
import { errorText } from '@/shared/api/errorText'
import { paths } from '@/shared/config/paths'
import { formatDateTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { ConfirmButton } from '@/shared/ui/ConfirmButton'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { useDeleteCv } from '@/entities/cv/api/useDeleteCv'
import { useRetryCv } from '@/entities/cv/api/useRetryCv'
import { StatusPill } from '@/entities/cv/components/StatusPill'
import { matchShortText } from '@/entities/cv/model/matchText'
import { statusView } from '@/entities/cv/model/statusView'
import { retryErrorText } from '@/entities/cv/model/usage'

const questions = (count: number) => (count === 1 ? '1 open question' : `${count} open questions`)

export function CvRow({ cv }: { cv: CvSummary }) {
  const remove = useDeleteCv()
  const retry = useRetryCv()
  const actions = statusView[cv.status].actions

  return (
    <li
      aria-labelledby={`cv-${cv.id}`}
      className="grid gap-x-4 gap-y-2.5 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 id={`cv-${cv.id}`} className="break-words">
          {cv.title}
        </h2>
        <MetaLine>
          <StatusPill status={cv.status} />
          <span>{cv.targetRole}</span>
          {cv.openQuestions > 0 ? <span>{questions(cv.openQuestions)}</span> : null}
          {cv.match && cv.match.total > 0 ? <span>{matchShortText(cv.match)}</span> : null}
          <span>
            Updated <time dateTime={cv.updatedAt}>{formatDateTime(cv.updatedAt)}</time>
          </span>
        </MetaLine>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {actions.includes('open') ? (
          <ButtonLink to={paths.cv(cv.id)} size="sm">
            Open
          </ButtonLink>
        ) : null}
        {actions.includes('watch') ? (
          <ButtonLink to={paths.cv(cv.id)} variant="secondary" size="sm">
            Watch progress
          </ButtonLink>
        ) : null}
        {actions.includes('retry') ? (
          <Button
            variant="secondary"
            size="sm"
            pending={retry.isPending}
            onClick={() => {
              remove.reset()
              retry.mutate(cv.id)
            }}
          >
            Retry
          </Button>
        ) : null}
        {actions.includes('delete') ? (
          <ConfirmButton
            confirmLabel="Delete for good"
            pending={remove.isPending}
            onConfirm={() => {
              retry.reset()
              remove.mutate(cv.id)
            }}
          >
            Delete
          </ConfirmButton>
        ) : null}
      </div>
      {remove.isError ? (
        <Notice tone="bad" role="alert" className="md:col-span-2">
          Could not delete this CV. {errorText(remove.error)}
        </Notice>
      ) : null}
      {retry.isError ? (
        <Notice tone="bad" role="alert" className="md:col-span-2">
          Could not retry this CV. {retryErrorText(retry.error)}
        </Notice>
      ) : null}
    </li>
  )
}
