import type { Cv } from '@cv/shared'

// The panels of the CV screen. Below 980 px one panel shows at a time; from 980 px the editor is
// always on the left and the side panel shows one of the side tabs. The choice is the `?tab=`
// search param, so a reload and a shared link open the same panel.

export type CvTab = 'edit' | 'questions' | 'match' | 'preview'
export type SideTab = Exclude<CvTab, 'edit'>

export const TAB_PARAM = 'tab'

/**
 * The tabs a CV has, in order. Questions shows while the CV has any, so the panel can still say
 * "no open questions" and list the answers once the last one is closed. Match shows while the
 * role has requirements to match.
 */
export const cvTabs = (cv: Pick<Cv, 'questions' | 'requirements'>): CvTab[] => [
  'edit',
  ...(cv.questions.length > 0 ? (['questions'] as const) : []),
  ...(cv.requirements.length > 0 ? (['match'] as const) : []),
  'preview',
]

export const sideTabs = (tabs: readonly CvTab[]): SideTab[] =>
  tabs.filter((tab): tab is SideTab => tab !== 'edit')

/** The tab named in the URL; the editor when it names none, or one this CV does not have. */
export const parseTab = (value: string | null, tabs: readonly CvTab[]): CvTab =>
  tabs.find((tab) => tab === value) ?? 'edit'

/**
 * What the side panel shows next to the editor: the chosen side tab, else the questions, which
 * wait for the user, else the preview of what will be downloaded.
 */
export const sideTabFor = (tab: CvTab, tabs: readonly CvTab[]): SideTab =>
  tab !== 'edit' ? tab : tabs.includes('questions') ? 'questions' : 'preview'

export function tabLabel(tab: CvTab, cv: Pick<Cv, 'questions'>): string {
  switch (tab) {
    case 'edit':
      return 'Edit'
    case 'match':
      return 'Match'
    case 'preview':
      return 'Preview'
    case 'questions': {
      const open = cv.questions.filter((question) => question.status === 'open').length
      return open > 0 ? `Questions · ${open}` : 'Questions'
    }
  }
}
