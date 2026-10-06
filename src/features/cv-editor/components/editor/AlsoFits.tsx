import type { Cv } from '@cv/shared'
import { useId } from 'react'
import { paths } from '@/shared/config/paths'
import { Chip } from '@/shared/ui/Chip'
import { MetaLine } from '@/shared/ui/MetaLine'

/** At most this many suggested roles are offered. */
const MAX_ROLES = 3

/**
 * "Also fits": roles this CV's background suits too. A chip opens New CV for that role, built
 * from this CV's source and facts.
 */
export function AlsoFits({ cv }: { cv: Pick<Cv, 'id' | 'suggestedRoles'> }) {
  const labelId = useId()
  const roles = cv.suggestedRoles.slice(0, MAX_ROLES)
  if (roles.length === 0) return null
  return (
    <MetaLine>
      <span id={labelId}>Also fits</span>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <li key={role} className="max-w-full">
            <Chip to={paths.newCv({ fromCvId: cv.id, role })}>{role}</Chip>
          </li>
        ))}
      </ul>
    </MetaLine>
  )
}
