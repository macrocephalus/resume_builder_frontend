import type { Cv } from '@cv/shared'

// The panels of the CV screen. Below 980 px one panel shows at a time; from 980 px the editor is
// always on the left and the side panel shows one of the side tabs. The choice is the `?tab=`
// search param, so a reload and a shared link open the same panel.

export type CvTab = 'edit' | 'questions' | 'preview'
export type SideTab = Exclude<CvTab, 'edit'>

export const TAB_PARAM = 'tab'

/**
 * The tabs a CV has, in order. Questions shows while the CV has any, so the panel can still say
 * "no open questions" and list the answers once the last one is closed.
 */
export const cvTabs = (cv: Pick<Cv, 'questions'>): CvTab[] =>
  cv.questions.length > 0 ? ['edit', 'questions', 'preview'] : ['edit', 'preview']

export const sideTabs = (tabs: readonly CvTab[]): SideTab[] =>
  tabs.filter((tab): tab is SideTab => tab !== 'edit')

/** The tab named in the URL; the editor when it names none, or one this CV does not have. */
export const parseTab = (value: string | null, tabs: readonly CvTab[]): CvTab =>
  tabs.find((tab) => tab === value) ?? 'edit'

/** What the side panel shows next to the editor: the chosen side tab, else the first one. */
export const sideTabFor = (tab: CvTab, tabs: readonly CvTab[]): SideTab =>
  tab === 'edit' ? (sideTabs(tabs)[0] ?? 'preview') : tab

export function tabLabel(tab: CvTab, cv: Pick<Cv, 'questions'>): string {
  switch (tab) {
    case 'edit':
      return 'Edit'
    case 'preview':
      return 'Preview'
    case 'questions': {
      const open = cv.questions.filter((question) => question.status === 'open').length
      return open > 0 ? `Questions · ${open}` : 'Questions'
    }
  }
}
