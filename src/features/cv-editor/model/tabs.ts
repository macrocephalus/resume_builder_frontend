// The panels of the CV screen. Below 980 px one panel shows at a time; from 980 px the editor is
// always on the left and the side panel shows one of the side tabs. The choice is the `?tab=`
// search param, so a reload and a shared link open the same panel.

export const CV_TABS = ['edit', 'preview'] as const
export type CvTab = (typeof CV_TABS)[number]
export type SideTab = Exclude<CvTab, 'edit'>

/** The tabs of the side panel, which sits next to the editor from 980 px. */
export const SIDE_TABS: readonly SideTab[] = CV_TABS.filter((tab) => tab !== 'edit')

export const TAB_PARAM = 'tab'

export const tabLabels: Record<CvTab, string> = { edit: 'Edit', preview: 'Preview' }

/** The tab named in the URL; the editor when it names none or an unknown one. */
export const parseTab = (value: string | null): CvTab =>
  CV_TABS.find((tab) => tab === value) ?? 'edit'

/** What the side panel shows next to the editor: the chosen side tab, else the preview. */
export const sideTabFor = (tab: CvTab): SideTab => (tab === 'edit' ? 'preview' : tab)
