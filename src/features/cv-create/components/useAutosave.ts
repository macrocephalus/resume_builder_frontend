import { DEFAULT_CV_LANGUAGE } from '@cv/shared'
import { useEffect } from 'react'
import type { UseFormWatch } from 'react-hook-form'
import { saveForm } from '@/features/cv-create/model/autosave'
import type { CreateFormInput } from '@/features/cv-create/model/createForm'

/**
 * Keeps the form in session storage on every change, so a reload does not lose it. It listens
 * through a `watch` callback, which re-renders nothing.
 */
export function useAutosave(watch: UseFormWatch<CreateFormInput>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const subscription = watch((values) =>
      saveForm({
        targetRole: values.targetRole ?? '',
        roleContext: values.roleContext ?? '',
        language: values.language ?? DEFAULT_CV_LANGUAGE,
        sourceText: values.sourceText ?? '',
        sourceType: values.sourceType ?? 'text',
        sourceFilename: values.sourceFilename ?? null,
      }),
    )
    return () => subscription.unsubscribe()
  }, [watch, enabled])
}
