import type { Match } from '@cv/shared'

type MatchCount = Pick<Match, 'covered' | 'total'>

/** The CV header's match bar: "Covers 7 of 10 requirements". */
export const matchBarText = ({ covered, total }: MatchCount) =>
  `Covers ${covered} of ${total} ${total === 1 ? 'requirement' : 'requirements'}`

/** The same numbers in a row of My CVs: "Match 7/10". */
export const matchShortText = ({ covered, total }: MatchCount) => `Match ${covered}/${total}`
