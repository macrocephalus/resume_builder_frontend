import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/ui/Button'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { usageQuery } from '@/features/cv-create/api/usageQuery'
import { blockedText, generationsText } from '@/features/cv-create/model/usage'

type UsageNoteProps = {
  /** A `429` for a limit is shown already: saying it twice would not help. */
  limitShown: boolean
}

/**
 * The generations left this hour, next to Create CV; or why a new CV cannot start now. Until the
 * limits load it shows nothing, and if they fail the form still works.
 */
export function UsageNote({ limitShown }: UsageNoteProps) {
  const usage = useQuery(usageQuery())
  if (usage.isError) {
    return (
      <Notice
        action={
          <Button variant="secondary" size="sm" onClick={() => void usage.refetch()}>
            Retry
          </Button>
        }
      >
        Could not load your limits. You can still create a CV.
      </Notice>
    )
  }
  if (!usage.data) return null
  const blocked = blockedText(usage.data)
  if (blocked) return limitShown ? null : <Notice tone="wait">{blocked}</Notice>
  return <MetaLine>{generationsText(usage.data.generations)}</MetaLine>
}
