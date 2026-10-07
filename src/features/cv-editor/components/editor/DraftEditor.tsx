import type { Cv, PatchCvBody } from '@cv/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { cx } from '@/shared/lib/cx'
import { SegmentedControl } from '@/shared/ui/SegmentedControl'
import { ContactsBlock } from '@/features/cv-editor/components/editor/ContactsBlock'
import { DraftHeader } from '@/features/cv-editor/components/editor/DraftHeader'
import { MovableBlock } from '@/features/cv-editor/components/editor/MovableBlock'
import { SaveBar } from '@/features/cv-editor/components/editor/SaveBar'
import { useCvTab } from '@/features/cv-editor/components/editor/useCvTab'
import { MatchPanel } from '@/features/cv-editor/components/match/MatchPanel'
import { PreviewPanel } from '@/features/cv-editor/components/preview/PreviewPanel'
import { QuestionsPanel } from '@/features/cv-editor/components/questions/QuestionsPanel'
import type { useDownloadPdf } from '@/features/cv-editor/api/useDownloadPdf'
import type { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import {
  draftFormSchema,
  toDraftForm,
  toPatchBody,
  type DraftFormValues,
} from '@/features/cv-editor/model/draftForm'
import type { ReplyOutcome, ReplyState } from '@/features/cv-editor/model/replies'
import { isVersionConflict, type SaveFirstOutcome } from '@/features/cv-editor/model/saveErrors'
import { tabLabel } from '@/features/cv-editor/model/tabs'

type DraftEditorProps = {
  cv: Cv
  save: ReturnType<typeof useSaveCv>
  /** Saves the form's changes; a reply's notice from before goes. */
  onSave: (body: PatchCvBody) => void
  reloading: boolean
  reloadError: unknown
  onReload: () => void
  /** Drops the unsaved changes by mounting a fresh form. */
  onDiscard: () => void
  /** Sends every replied card in one request. */
  onApply: () => void
  replies: ReplyState
  pdf: ReturnType<typeof useDownloadPdf>
  /** Fetches the PDF of the saved draft. */
  onDownload: () => void
}

/**
 * One form over the title and the whole draft. Its parent keys it by the CV's version, so a new
 * version from the server mounts a fresh form; nothing syncs the values by hand. Cancel mounts a
 * fresh form too: `reset()` relies on inputs registering again on render, which React Compiler
 * skips. Nothing here reads form state but the block order, so typing does not re-render the
 * editor. While a save runs the fields are disabled: its answer remounts the form, which would
 * drop what was typed.
 *
 * Below 980 px one panel shows at a time, picked by the `?tab=` param; the editor stays mounted
 * and hidden, so its values stay. From 980 px the editor sits on the left and the side panel on
 * the right.
 */
export function DraftEditor({
  cv,
  save,
  onSave,
  reloading,
  reloadError,
  onReload,
  onDiscard,
  onApply,
  replies,
  pdf,
  onDownload,
}: DraftEditorProps) {
  const defaultValues = toDraftForm(cv)
  const form = useForm<DraftFormValues>({
    defaultValues,
    resolver: zodResolver(draftFormSchema),
  })

  const order = useWatch({ control: form.control, name: 'sectionOrder' })
  const swap = (from: number, to: number) => {
    const next = [...order]
    ;[next[from], next[to]] = [order[to]!, order[from]!]
    form.setValue('sectionOrder', next, { shouldDirty: true })
  }

  const { wide, tab, side, switchTabs, switchValue, choose } = useCvTab(cv)

  const submit = form.handleSubmit(
    (values) => {
      const body = toPatchBody(values, cv)
      // Only blank items or spaces were added: there is nothing to store.
      if (!body) onDiscard()
      else onSave(body)
    },
    // On a phone the field with the error may sit in the hidden editor panel.
    () => choose('edit'),
  )

  // The replies and the PDF use the saved draft, so unsaved edits are saved first; if that fails,
  // or the form has errors, the action does not start.
  const saveFirst = async (): Promise<SaveFirstOutcome> => {
    if (!(await form.trigger())) {
      // On a phone the marked fields sit in the hidden editor panel.
      choose('edit')
      return 'invalid'
    }
    const body = toPatchBody(form.getValues(), cv)
    if (body) {
      try {
        await save.mutateAsync(body)
      } catch {
        return 'not-saved'
      }
    }
    return 'saved'
  }

  const apply = async (): Promise<ReplyOutcome> => {
    const outcome = await saveFirst()
    if (outcome !== 'saved') return outcome
    onApply()
    return 'sent'
  }

  const download = async (): Promise<SaveFirstOutcome> => {
    const outcome = await saveFirst()
    if (outcome === 'saved') onDownload()
    return outcome
  }

  // A save or an applied batch brings a new version, which remounts the form: nothing typed
  // meanwhile would survive, so the fields wait.
  const busy = save.isPending || replies.applying

  const panelSwitch =
    switchTabs.length > 0 ? (
      <SegmentedControl
        label="Panel"
        items={switchTabs.map((value) => ({ value, label: tabLabel(value, cv) }))}
        value={switchValue}
        onChange={choose}
        block={!wide}
        // On a phone it sticks right under the top bar, so nothing scrolls into a gap above it.
        className={cx(wide ? 'justify-self-start' : 'sticky top-14 z-[5]')}
      />
    ) : null

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <fieldset disabled={busy} className="contents">
          <DraftHeader
            cv={cv}
            conflict={isVersionConflict(save.error)}
            reloading={reloading}
            reloadError={reloadError}
            onReload={onReload}
            pdf={pdf}
            onDownload={download}
          />
        </fieldset>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          {wide ? null : panelSwitch}
          <fieldset
            disabled={busy}
            className={cx('min-w-0 flex-col gap-4 lg:flex', tab === 'edit' ? 'flex' : 'hidden')}
          >
            <ContactsBlock />
            {order.map((section, index) => (
              <MovableBlock
                key={section}
                section={section}
                move={{
                  up: index > 0 ? () => swap(index, index - 1) : undefined,
                  down: index < order.length - 1 ? () => swap(index, index + 1) : undefined,
                }}
              />
            ))}
          </fieldset>
          {wide || tab !== 'edit' ? (
            <div
              className={cx(
                'flex min-w-0 flex-col gap-3',
                // The one A4 sheet stays in view next to a long editor; a list of questions
                // scrolls with the page instead of being cut at the bottom of the screen.
                side === 'preview' &&
                  'lg:sticky lg:top-18 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto',
              )}
            >
              {wide ? panelSwitch : null}
              {side === 'questions' ? (
                <QuestionsPanel cv={cv} replies={replies} onApply={apply} saving={save.isPending} />
              ) : side === 'match' ? (
                <MatchPanel requirements={cv.requirements} />
              ) : (
                <PreviewPanel language={cv.language} />
              )}
            </div>
          ) : null}
        </div>
        <SaveBar control={form.control} save={save} onCancel={onDiscard} />
      </form>
    </FormProvider>
  )
}
