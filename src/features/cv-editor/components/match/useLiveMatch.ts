import { computeMatch, type Requirement } from '@cv/shared'
import { useDeferredCvData } from '@/features/cv-editor/components/editor/useDeferredCvData'

/**
 * The match of the values being edited, computed in the browser with the contract's
 * `computeMatch`: no request. It follows the edits a moment after typing.
 */
export function useLiveMatch(requirements: readonly Requirement[]) {
  return computeMatch(useDeferredCvData(), requirements)
}
