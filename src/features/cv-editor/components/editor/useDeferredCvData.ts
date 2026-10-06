import { useDeferredValue } from 'react'
import { useWatch } from 'react-hook-form'
import { toCvData, type DraftFormValues } from '@/features/cv-editor/model/draftForm'

/**
 * The draft as the form holds it now, from a deferred copy of the values: a panel that reads it
 * catches up a moment after typing, so typing stays responsive.
 */
export function useDeferredCvData() {
  return toCvData(useDeferredValue(useWatch<DraftFormValues>() as DraftFormValues))
}
