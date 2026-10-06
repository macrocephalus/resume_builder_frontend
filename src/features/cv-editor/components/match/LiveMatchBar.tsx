import type { Requirement } from '@cv/shared'
import { MatchBar } from '@/entities/cv/components/MatchBar'
import { useLiveMatch } from '@/features/cv-editor/components/match/useLiveMatch'

/**
 * The header's match bar, following the edits. It watches the form on its own, so typing
 * re-renders the bar, not the header.
 */
export function LiveMatchBar({ requirements }: { requirements: readonly Requirement[] }) {
  return <MatchBar match={useLiveMatch(requirements)} />
}
