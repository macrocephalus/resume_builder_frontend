import type { Cv } from '@cv/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { ContactsBlock } from '@/features/cv-editor/components/editor/ContactsBlock'
import { DraftHeader } from '@/features/cv-editor/components/editor/DraftHeader'
import { MovableBlock } from '@/features/cv-editor/components/editor/MovableBlock'
import { SaveBar } from '@/features/cv-editor/components/editor/SaveBar'
import type { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import {
  draftFormSchema,
  toDraftForm,
  toPatchBody,
  type DraftFormValues,
} from '@/features/cv-editor/model/draftForm'
import { isVersionConflict } from '@/features/cv-editor/model/saveErrors'

type DraftEditorProps = {
  cv: Cv
  save: ReturnType<typeof useSaveCv>
  reloading: boolean
  reloadError: unknown
  onReload: () => void
  /** Drops the unsaved changes by mounting a fresh form. */
  onDiscard: () => void
}

/**
 * One form over the title and the whole draft. Its parent keys it by the CV's version, so a new
 * version from the server mounts a fresh form; nothing syncs the values by hand. Cancel mounts a
 * fresh form too: `reset()` relies on inputs registering again on render, which React Compiler
 * skips. Nothing here reads form state, so typing does not re-render the editor. While a save
 * runs the fields are disabled: the answer remounts the form, which would drop what was typed.
 */
export function DraftEditor({
  cv,
  save,
  reloading,
  reloadError,
  onReload,
  onDiscard,
}: DraftEditorProps) {
  const defaultValues = toDraftForm(cv)
  const form = useForm<DraftFormValues>({
    defaultValues,
    resolver: zodResolver(draftFormSchema),
  })

  const submit = form.handleSubmit((values) => {
    const body = toPatchBody(values, cv)
    // Only blank items or spaces were added: there is nothing to store.
    if (!body) onDiscard()
    else save.mutate(body)
  })

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <fieldset disabled={save.isPending} className="contents">
          <DraftHeader
            cv={cv}
            conflict={isVersionConflict(save.error)}
            reloading={reloading}
            reloadError={reloadError}
            onReload={onReload}
          />
          <ContactsBlock />
          {defaultValues.sectionOrder.map((section) => (
            <MovableBlock key={section} section={section} />
          ))}
        </fieldset>
        <SaveBar control={form.control} save={save} onCancel={onDiscard} />
      </form>
    </FormProvider>
  )
}
