import type { Cv } from '@cv/shared'
import { useSearchParams } from 'react-router'
import { useMediaQuery, WIDE } from '@/shared/lib/useMediaQuery'
import {
  cvTabs,
  parseTab,
  sideTabFor,
  sideTabs,
  TAB_PARAM,
  type CvTab,
} from '@/features/cv-editor/model/tabs'

/**
 * The panel of the CV screen, kept in `?tab=`. From 980 px (`wide`) the editor is always shown
 * and the switch offers the side tabs only.
 */
export function useCvTab(cv: Pick<Cv, 'questions' | 'requirements'>) {
  const wide = useMediaQuery(WIDE)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabs = cvTabs(cv)
  const tab = parseTab(searchParams.get(TAB_PARAM), tabs)
  const side = sideTabFor(tab, tabs)
  const sides = sideTabs(tabs)

  // Written with replace, so Back leaves the CV instead of walking through panels.
  const choose = (next: CvTab) =>
    setSearchParams(
      (params) => {
        if (next === 'edit') params.delete(TAB_PARAM)
        else params.set(TAB_PARAM, next)
        return params
      },
      { replace: true },
    )

  return {
    wide,
    tab,
    side,
    /** The switch: every tab on a phone; the side tabs next to the editor, if more than one. */
    switchTabs: wide ? (sides.length > 1 ? sides : []) : tabs,
    switchValue: wide ? side : tab,
    choose,
  }
}
