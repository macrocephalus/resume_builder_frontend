import { cvLanguageSchema, SOURCE_TYPES } from '@cv/shared'
import { z } from 'zod'

const KEY = 'ai-cv-builder:new-cv-form'

/** What the New CV form keeps across a reload. Stored text is untrusted: it is parsed back. */
const savedFormSchema = z.object({
  targetRole: z.string(),
  roleContext: z.string(),
  language: cvLanguageSchema,
  sourceText: z.string(),
  sourceType: z.enum(SOURCE_TYPES),
  sourceFilename: z.string().nullable(),
})
export type SavedForm = z.infer<typeof savedFormSchema>

// The browser may block storage (private mode, a policy) or have it full: every call is guarded,
// and a form that cannot be kept is simply not kept.
const sessionStore = (): Storage | null => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** The form as it was before a reload, or `null`. */
export function loadSavedForm(storage = sessionStore()): SavedForm | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const parsed = savedFormSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveForm(form: SavedForm, storage = sessionStore()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(form))
  } catch {
    // Not kept: the form still works.
  }
}

/** After a successful create the form starts empty again. */
export function clearSavedForm(storage = sessionStore()): void {
  try {
    storage?.removeItem(KEY)
  } catch {
    // Nothing to clear that could be read back.
  }
}
