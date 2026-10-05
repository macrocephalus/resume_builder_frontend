import type { Cv } from '@cv/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { cx } from '@/shared/lib/cx'
import { SegmentedControl } from '@/shared/ui/SegmentedControl'
import { ContactsBlock } from '@/features/cv-editor/components/editor/ContactsBlock'
import { DraftHeader } from '@/features/cv-editor/components/editor/DraftHeader'
import { MovableBlock } from '@/features/cv-editor/components/editor/MovableBlock'
import { SaveBar } from '@/features/cv-editor/components/editor/SaveBar'
import { PreviewPanel } from '@/features/cv-editor/components/preview/PreviewPanel'
import type { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import {
  draftFormSchema,
  toDraftForm,
  toPatchBody,
  type DraftFormValues,
} from '@/features/cv-editor/model/draftForm'
import { isVersionConflict } from '@/features/cv-editor/model/saveErrors'
import {
  CV_TABS,
  parseTab,
  SIDE_TABS,
  sideTabFor,
  TAB_PARAM,
  tabLabels,
  type CvTab,
} from '@/features/cv-editor/model/tabs'

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
 * skips. Nothing here reads form state but the block order, so typing does not re-render the
 * editor. While a save runs the fields are disabled: the answer remounts the form, which would
 * drop what was typed.
 *
 * Below 980 px one panel shows at a time, picked by the `?tab=` param; from 980 px the editor sits
 * on the left and the side panel on the right.
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

  const order = useWatch({ control: form.control, name: 'sectionOrder' })
  const swap = (from: number, to: number) => {
    const next = [...order]
    ;[next[from], next[to]] = [order[to]!, order[from]!]
    form.setValue('sectionOrder', next, { shouldDirty: true })
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get(TAB_PARAM))
  const sideTab = sideTabFor(tab)
  // Written with replace, so Back leaves the CV instead of walking through panels.
  const chooseTab = (next: CvTab) =>
    setSearchParams(
      (params) => {
        if (next === 'edit') params.delete(TAB_PARAM)
        else params.set(TAB_PARAM, next)
        return params
      },
      { replace: true },
    )

  const submit = form.handleSubmit(
    (values) => {
      const body = toPatchBody(values, cv)
      // Only blank items or spaces were added: there is nothing to store.
      if (!body) onDiscard()
      else save.mutate(body)
    },
    // On a phone the field with the error may sit in the hidden editor panel.
    () => chooseTab('edit'),
  )

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
        </fieldset>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <SegmentedControl
            label="Panel"
            items={CV_TABS.map((value) => ({ value, label: tabLabels[value] }))}
            value={tab}
            onChange={chooseTab}
            // Next to the editor it switches side panels only, and one needs no switch.
            className={cx(
              'sticky top-16 z-[5] justify-self-start',
              SIDE_TABS.length < 2 && 'lg:hidden',
            )}
          />
          <fieldset
            disabled={save.isPending}
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
          <div
            className={cx(
              'min-w-0 lg:sticky lg:top-18 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto',
              tab === 'edit' ? 'hidden' : 'block',
            )}
          >
            {sideTab === 'preview' ? <PreviewPanel language={cv.language} /> : null}
          </div>
        </div>
        <SaveBar control={form.control} save={save} onCancel={onDiscard} />
      </form>
    </FormProvider>
  )
}
