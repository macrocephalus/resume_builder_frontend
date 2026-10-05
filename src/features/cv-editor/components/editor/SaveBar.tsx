import { useEffect } from 'react'
import { useFormState, type Control } from 'react-hook-form'
import { useBlocker } from 'react-router'
import { routes } from '@/shared/config/paths'
import { Button } from '@/shared/ui/Button'
import { FloatingBar } from '@/shared/ui/FloatingBar'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'
import { isDiscardingEdits } from '@/features/cv-editor/model/leaving'
import { isVersionConflict, saveErrorText } from '@/features/cv-editor/model/saveErrors'

type SaveState = { isPending: boolean; isSuccess: boolean; error: unknown }

const focus = (node: HTMLButtonElement | null) => node?.focus()

type SaveBarProps = {
  control: Control<DraftFormValues>
  save: SaveState
  onCancel: () => void
}

/**
 * The only part of the editor that reads dirty state, so typing re-renders this bar alone. It
 * shows while there are unsaved changes, says "Saved ✓" after a save, and guards against leaving
 * with unsaved changes: in the app (a router blocker) and when the tab closes (`beforeunload`).
 */
export function SaveBar({ control, save, onCancel }: SaveBarProps) {
  const { isDirty } = useFormState({ control })

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      nextLocation.pathname !== currentLocation.pathname &&
      // A session that ended goes to login, and a deleted CV has nothing left to save.
      nextLocation.pathname !== routes.login &&
      !isDiscardingEdits(nextLocation.state),
  )

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  if (blocker.state === 'blocked') {
    return (
      <FloatingBar role="alertdialog" aria-label="Leave without saving?">
        <p className="grow">Leave without saving?</p>
        <Button variant="secondary" size="sm" ref={focus} onClick={() => blocker.reset()}>
          Stay
        </Button>
        <Button variant="secondary" size="sm" onClick={() => blocker.proceed()}>
          Leave
        </Button>
      </FloatingBar>
    )
  }

  // Saving again can only conflict again: the way on is "Reload latest" in the header.
  if (isDirty && isVersionConflict(save.error)) {
    return (
      <FloatingBar aria-label="Unsaved changes">
        <p role="alert">{saveErrorText(save.error)} Reload the latest version above.</p>
      </FloatingBar>
    )
  }

  if (isDirty) {
    return (
      <FloatingBar aria-label="Unsaved changes">
        {save.error ? (
          <p role="alert" className="grow">
            {saveErrorText(save.error)}
          </p>
        ) : (
          <p className="grow">You have unsaved changes.</p>
        )}
        <Button variant="secondary" size="sm" disabled={save.isPending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" pending={save.isPending}>
          Save
        </Button>
      </FloatingBar>
    )
  }

  return save.isSuccess ? (
    <FloatingBar>
      <output>Saved ✓</output>
    </FloatingBar>
  ) : null
}
