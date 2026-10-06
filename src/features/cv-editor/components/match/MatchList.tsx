import type { RequirementMatch } from '@cv/shared'
import { useId } from 'react'
import { ListPanel } from '@/shared/ui/ListPanel'
import { MetaLine } from '@/shared/ui/MetaLine'

type MatchListProps = {
  title: string
  items: readonly RequirementMatch[]
  /** The line under a requirement: where it was found, or what to do. */
  detail: (item: RequirementMatch) => string
}

/** One group of requirements under its heading. */
export function MatchList({ title, items, detail }: MatchListProps) {
  const headingId = useId()
  return (
    <div className="flex flex-col gap-2">
      <h3 id={headingId}>{title}</h3>
      <ListPanel aria-labelledby={headingId}>
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-0.5 px-4 py-3">
            <p>{item.label}</p>
            <MetaLine>{detail(item)}</MetaLine>
          </li>
        ))}
      </ListPanel>
    </div>
  )
}
