import type { Cv } from '@cv/shared'
import { get, useFormContext, useFormState } from 'react-hook-form'
import { errorText } from '@/shared/api/errorText'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { Panel } from '@/shared/ui/Panel'
import { StatusPill } from '@/entities/cv/components/StatusPill'
import { DeleteCv } from '@/features/cv-editor/components/DeleteCv'
import { DownloadPdf } from '@/features/cv-editor/components/pdf/DownloadPdf'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'
import { verificationText } from '@/features/cv-editor/model/questions'
import type { SaveFirstOutcome } from '@/features/cv-editor/model/saveErrors'

type DraftHeaderProps = {
  cv: Cv
  /** The last save was refused because the CV changed elsewhere. */
  conflict: boolean
  reloading: boolean
  /** Why "Reload latest" failed. */
  reloadError: unknown
  onReload: () => void
  pdf: { isPending: boolean; error: unknown }
  /** Saves unsaved edits first, then downloads the PDF. */
  onDownload: () => Promise<SaveFirstOutcome>
}

/**
 * The editable title, the status and target role, the fact-check and conflict notices, Download
 * PDF and Delete.
 */
export function DraftHeader({
  cv,
  conflict,
  reloading,
  reloadError,
  onReload,
  pdf,
  onDownload,
}: DraftHeaderProps) {
  const open = cv.questions.filter((question) => question.status === 'open').length
  const { register } = useFormContext<DraftFormValues>()
  const { errors } = useFormState<DraftFormValues>({ name: 'title', exact: true })
  const titleError: unknown = get(errors, 'title')?.message

  return (
    <Panel className="flex flex-col gap-3 p-4 md:p-6">
      <h1 className="sr-only">{cv.title}</h1>
      <Field label="CV title" error={typeof titleError === 'string' ? titleError : undefined}>
        {(control) => <Input {...control} {...register('title')} look="title" autoComplete="off" />}
      </Field>
      <MetaLine>
        <StatusPill status={cv.status} />
        <span>{cv.targetRole}</span>
        {open > 0 ? <span>{open === 1 ? '1 open question' : `${open} open questions`}</span> : null}
      </MetaLine>
      {cv.verification ? <Notice>{verificationText(cv.verification)}</Notice> : null}
      {conflict ? (
        <Notice
          tone="wait"
          action={
            <Button variant="secondary" size="sm" pending={reloading} onClick={onReload}>
              Reload latest
            </Button>
          }
        >
          This CV was changed in another tab. Reload the latest version to keep editing; your
          unsaved edits here will be lost.
          {reloadError ? ` Could not reload. ${errorText(reloadError)}` : null}
        </Notice>
      ) : null}
      <DownloadPdf pdf={pdf} onDownload={onDownload} openQuestions={open} />
      <DeleteCv cvId={cv.id} />
    </Panel>
  )
}
