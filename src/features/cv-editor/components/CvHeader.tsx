import type { Cv } from '@cv/shared'
import { MetaLine } from '@/shared/ui/MetaLine'
import { StatusPill } from '@/entities/cv/components/StatusPill'

/** The CV's title, status and target role, on top of every panel of the CV screen. */
export function CvHeader({ cv }: { cv: Cv }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1>{cv.title}</h1>
      <MetaLine>
        <StatusPill status={cv.status} />
        <span>{cv.targetRole}</span>
      </MetaLine>
    </div>
  )
}
