import type { Match } from '@cv/shared'

type MatchCount = Pick<Match, 'covered' | 'total'>

/** How much of the role a CV covers, in a row of My CVs: "Match 7/10". */
export const matchShortText = ({ covered, total }: MatchCount) => `Match ${covered}/${total}`
