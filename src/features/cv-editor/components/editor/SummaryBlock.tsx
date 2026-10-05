import { EditorBlock } from '@/features/cv-editor/components/editor/EditorBlock'
import { TextField } from '@/features/cv-editor/components/editor/TextField'

export function SummaryBlock() {
  return (
    <EditorBlock title="Summary" missing="summary">
      <TextField
        name="summary"
        label="About you"
        hint="Two to four sentences aimed at the target role."
        rows={5}
      />
    </EditorBlock>
  )
}
