import type { Match } from '@cv/shared'
import { MetaLine } from '@/shared/ui/MetaLine'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { matchBarText } from '@/entities/cv/model/matchText'

/** "Covers 7 of 10 requirements" over a bar filled to the share covered. */
export function MatchBar({ match }: { match: Pick<Match, 'covered' | 'total'> }) {
  const text = matchBarText(match)
  return (
    <div className="flex max-w-sm flex-col gap-1.5">
      <MetaLine aria-hidden="true">{text}</MetaLine>
      <ProgressBar
        label={text}
        meter
        value={match.total === 0 ? 0 : (match.covered / match.total) * 100}
      />
    </div>
  )
}
