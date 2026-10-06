import { hasDraft } from '@cv/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { paths } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Notice } from '@/shared/ui/Notice'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { CreateCvForm } from '@/features/cv-create/components/CreateCvForm'

/**
 * The New CV form for a CV made from another one; the route loader has fetched that one. A CV
 * with no draft yet has no facts to start from, which the API would refuse, so it says so first.
 */
export function CreateFromCv({ fromCvId, role }: { fromCvId: string; role: string }) {
  const { data: parent } = useSuspenseQuery(cvQueries.detail(fromCvId))
  if (!hasDraft(parent.status)) {
    return (
      <Notice
        tone="wait"
        action={
          <ButtonLink to={paths.newCv()} variant="secondary" size="sm">
            Use your own text
          </ButtonLink>
        }
      >
        “{parent.title}” has no draft yet, so a new CV cannot start from it.
      </Notice>
    )
  }
  return <CreateCvForm role={role} parent={parent} />
}
