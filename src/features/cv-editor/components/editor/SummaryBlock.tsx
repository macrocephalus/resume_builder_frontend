import { sectionTitles } from '@/features/cv-editor/model/blocks'
import { EditorBlock, type BlockMove } from '@/features/cv-editor/components/editor/EditorBlock'
import { TextField } from '@/features/cv-editor/components/editor/TextField'

export function SummaryBlock({ move }: { move: BlockMove }) {
  return (
    <EditorBlock title={sectionTitles.summary} missing="summary" move={move}>
      <TextField
        name="summary"
        label="About you"
        hint="Two to four sentences aimed at the target role."
        rows={5}
      />
    </EditorBlock>
  )
}
