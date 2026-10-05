import type { MovableSection } from '@cv/shared'
import type { BlockMove } from '@/features/cv-editor/components/editor/EditorBlock'
import { ItemBlock } from '@/features/cv-editor/components/editor/ItemBlock'
import { SkillsBlock } from '@/features/cv-editor/components/editor/SkillsBlock'
import { SummaryBlock } from '@/features/cv-editor/components/editor/SummaryBlock'

/** The editor of one block below Contacts, with its up / down controls. */
export function MovableBlock({ section, move }: { section: MovableSection; move: BlockMove }) {
  switch (section) {
    case 'summary':
      return <SummaryBlock move={move} />
    case 'skills':
      return <SkillsBlock move={move} />
    default:
      return <ItemBlock section={section} move={move} />
  }
}
