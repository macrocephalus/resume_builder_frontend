// What closing a question does to the CV's status in mock mode. Writing the answer into the draft
// is `applyAnswer` from `@cv/shared`, the same function the server uses.

import type { Cv } from '@cv/shared'

/** A `needs_input` CV with no open question left becomes `ready`. */
export function readyWhenAnswered(cv: Cv): void {
  if (cv.status === 'needs_input' && !cv.questions.some((question) => question.status === 'open')) {
    cv.status = 'ready'
  }
}
