import type { MatchPlace, RequirementKind } from '@cv/shared'
import { formatList } from '@/shared/lib/format'
import { sectionTitles } from '@/features/cv-editor/model/blocks'

/** Where a covered requirement was found: "Found in experience and skills". */
export const foundInText = (places: readonly MatchPlace[]) =>
  `Found in ${formatList(places.map((place) => sectionTitles[place].toLowerCase()))}`

/**
 * What to do about a missing requirement. The CV only says what is true, so nothing is added for
 * the user: they add it themselves, if it is.
 */
export const missingHint = (kind: RequirementKind) =>
  kind === 'experience'
    ? 'Add it in the editor if it’s true.'
    : 'Add it to your skills if you have it.'
