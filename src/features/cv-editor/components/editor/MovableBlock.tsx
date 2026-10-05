import type { MovableSection } from '@cv/shared'
import { ItemBlock } from '@/features/cv-editor/components/editor/ItemBlock'
import { SkillsBlock } from '@/features/cv-editor/components/editor/SkillsBlock'
import { SummaryBlock } from '@/features/cv-editor/components/editor/SummaryBlock'

/** The editor of one block below Contacts. */
export function MovableBlock({ section }: { section: MovableSection }) {
  switch (section) {
    case 'summary':
      return <SummaryBlock />
    case 'skills':
      return <SkillsBlock />
    default:
      return <ItemBlock section={section} />
  }
}
