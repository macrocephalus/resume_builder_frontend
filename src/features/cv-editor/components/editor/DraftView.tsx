import type { Cv } from '@cv/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import { DraftEditor } from '@/features/cv-editor/components/editor/DraftEditor'

/**
 * The CV screen for a CV with a draft. The save lives here, above the form, so "Saved ✓" and a
 * save error outlive the remount that a new version causes.
 */
export function DraftView({ cv }: { cv: Cv }) {
  const queryClient = useQueryClient()
  const save = useSaveCv(cv.id)
  const [reloading, startReload] = useTransition()
  const [reloadError, setReloadError] = useState<unknown>(null)
  // Counts discards, so a discard mounts a fresh form like a new version does.
  const [discards, setDiscards] = useState(0)

  const discard = () => {
    save.reset()
    setDiscards((count) => count + 1)
  }

  // After a conflict: fetch the newer version, which remounts the form with its values. The
  // notice stays until that worked.
  const reload = () =>
    startReload(async () => {
      try {
        await queryClient.refetchQueries(
          { queryKey: cvQueries.detail(cv.id).queryKey },
          { throwOnError: true },
        )
        setReloadError(null)
        save.reset()
      } catch (error) {
        setReloadError(error)
      }
    })

  return (
    <div className="flex flex-col gap-4">
      <DraftEditor
        key={`${cv.version}:${discards}`}
        cv={cv}
        save={save}
        reloading={reloading}
        reloadError={reloadError}
        onReload={reload}
        onDiscard={discard}
      />
    </div>
  )
}
