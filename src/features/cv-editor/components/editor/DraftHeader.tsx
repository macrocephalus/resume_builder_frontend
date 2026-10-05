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
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'

type DraftHeaderProps = {
  cv: Cv
  /** The last save was refused because the CV changed elsewhere. */
  conflict: boolean
  reloading: boolean
  /** Why "Reload latest" failed. */
  reloadError: unknown
  onReload: () => void
}

/** The editable title, the status and target role, the conflict notice and Delete. */
export function DraftHeader({ cv, conflict, reloading, reloadError, onReload }: DraftHeaderProps) {
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
      <DeleteCv cvId={cv.id} />
    </Panel>
  )
}
