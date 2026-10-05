import { useWatch, type Control } from 'react-hook-form'
import { MetaLine } from '@/shared/ui/MetaLine'
import {
  formatCount,
  SOURCE_TEXT_MAX,
  type CreateFormInput,
} from '@/features/cv-create/model/createForm'

/** Reads the text on its own, so typing re-renders only this line. */
export function SourceCounter({ control }: { control: Control<CreateFormInput> }) {
  const text = useWatch({ control, name: 'sourceText' }) ?? ''

  return (
    <MetaLine>
      <span>
        {formatCount(text.trim().length)} / {formatCount(SOURCE_TEXT_MAX)} characters
      </span>
    </MetaLine>
  )
}
