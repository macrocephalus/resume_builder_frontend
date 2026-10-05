import { useWatch } from 'react-hook-form'
import { Pill } from '@/shared/ui/Pill'
import { missingParts, type DraftFormValues } from '@/features/cv-editor/model/draftForm'

/**
 * "missing" next to a required block or field the draft lacks, by the contract's rule. It watches
 * the form on its own, so typing re-renders the marks, not the editor.
 */
export function MissingMark({ part }: { part: string }) {
  const values = useWatch<DraftFormValues>() as DraftFormValues
  return missingParts(values).has(part) ? <Pill tone="wait">missing</Pill> : null
}
