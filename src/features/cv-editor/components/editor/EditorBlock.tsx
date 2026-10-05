import { useId, type ReactNode } from 'react'
import { Panel } from '@/shared/ui/Panel'
import { MissingMark } from '@/features/cv-editor/components/editor/MissingMark'

type EditorBlockProps = {
  title: string
  /** The key of `missingParts` that marks the whole block. */
  missing?: string
  children: ReactNode
}

/** One block of the draft: a solid panel named by its heading. */
export function EditorBlock({ title, missing, children }: EditorBlockProps) {
  const headingId = useId()
  return (
    <Panel aria-labelledby={headingId} className="flex flex-col gap-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId}>{title}</h2>
        {missing ? <MissingMark part={missing} /> : null}
      </div>
      {children}
    </Panel>
  )
}
