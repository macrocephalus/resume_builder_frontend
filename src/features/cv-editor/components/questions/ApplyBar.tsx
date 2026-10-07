import { LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { FloatingBar } from '@/shared/ui/FloatingBar'
import { applyLabel } from '@/features/cv-editor/model/replies'

type ApplyBarProps = {
  /** Replied and skipped cards whose question is still open. */
  count: number
  /** The edits are being saved first, or the batch is on its way. */
  applying: boolean
  /** Why the last batch was not applied. */
  error: string | null
  onApply: () => void
  /** Turns every card back to open, and drops the error. */
  onClear: () => void
}

/**
 * "Apply N replies" and Clear, stuck to the bottom of the Questions panel above the save bar's
 * place. While the batch runs it says so, for screen readers too; the request can take a while.
 */
export function ApplyBar({ count, applying, error, onApply, onClear }: ApplyBarProps) {
  return (
    <FloatingBar place="above-bar" aria-label="Apply replies">
      <p aria-live="polite" className="flex grow items-center gap-2">
        {applying ? (
          <>
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="shrink-0 motion-safe:animate-spin"
            />
            Updating your CV…
          </>
        ) : null}
      </p>
      <Button variant="secondary" size="sm" disabled={applying} onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" pending={applying} disabled={count === 0} onClick={onApply}>
        {applyLabel(count)}
      </Button>
      {error !== null && !applying ? (
        <p role="alert" className="basis-full">
          {error}
        </p>
      ) : null}
    </FloatingBar>
  )
}
