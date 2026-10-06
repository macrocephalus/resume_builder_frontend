import type { Requirement } from '@cv/shared'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { MatchList } from '@/features/cv-editor/components/match/MatchList'
import { useLiveMatch } from '@/features/cv-editor/components/match/useLiveMatch'
import { foundInText, missingHint } from '@/features/cv-editor/model/match'

/**
 * The role's requirements: the missing ones first, with what to do, then the covered ones, with
 * where they were found. It follows the edits; nothing is ever added to the CV from here.
 */
export function MatchPanel({ requirements }: { requirements: readonly Requirement[] }) {
  const { items } = useLiveMatch(requirements)
  const missing = items.filter((item) => !item.covered)
  const covered = items.filter((item) => item.covered)

  return (
    <section aria-labelledby="cv-match-heading" className="flex flex-col gap-4">
      <h2 id="cv-match-heading" className="sr-only">
        Match
      </h2>
      <MetaLine>
        What the role asks for, looked up in your summary, experience, projects and skills.
      </MetaLine>
      {missing.length > 0 ? (
        <MatchList
          title={`Missing (${missing.length})`}
          items={missing}
          detail={(item) => missingHint(item.kind)}
        />
      ) : (
        <Notice tone="ok">The CV covers every requirement of the role.</Notice>
      )}
      {covered.length > 0 ? (
        <MatchList
          title={`Covered (${covered.length})`}
          items={covered}
          detail={(item) => foundInText(item.foundIn)}
        />
      ) : null}
    </section>
  )
}
