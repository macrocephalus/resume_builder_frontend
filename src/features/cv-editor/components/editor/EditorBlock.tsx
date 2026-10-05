import { ArrowDown, ArrowUp } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import { Panel } from '@/shared/ui/Panel'
import { MissingMark } from '@/features/cv-editor/components/editor/MissingMark'

/** Moves a block in the CV's order; a missing direction is the edge of the order. */
export type BlockMove = { up?: () => void; down?: () => void }

type EditorBlockProps = {
  title: string
  /** The key of `missingParts` that marks the whole block. */
  missing?: string
  /** Up / down controls; Contacts has none, since it always comes first. */
  move?: BlockMove
  children: ReactNode
}

/** One block of the draft: a solid panel named by its heading. */
export function EditorBlock({ title, missing, move, children }: EditorBlockProps) {
  const headingId = useId()
  return (
    <Panel aria-labelledby={headingId} className="flex flex-col gap-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId}>{title}</h2>
        {missing ? <MissingMark part={missing} /> : null}
        {move ? (
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Move block up"
              className="min-w-10"
              disabled={!move.up}
              onClick={move.up}
            >
              <ArrowUp size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Move block down"
              className="min-w-10"
              disabled={!move.down}
              onClick={move.down}
            >
              <ArrowDown size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
      {children}
    </Panel>
  )
}
