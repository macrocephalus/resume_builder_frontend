import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'

/**
 * How saving the form before another action ended: saved or nothing to save, the form has
 * errors, or the save failed.
 */
export type SaveFirstOutcome = 'saved' | 'invalid' | 'not-saved'

/** The save was refused because the CV changed since this tab loaded it. */
export const isVersionConflict = (error: unknown) =>
  error instanceof ApiError && error.code === 'VERSION_CONFLICT'

/** Why a save failed, for the save bar. */
export function saveErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'VERSION_CONFLICT':
        return 'Not saved: this CV changed in another tab.'
      case 'INVALID_STATE':
        return 'Not saved: this CV cannot be edited right now. Reload the page.'
    }
  }
  return `Not saved. ${errorText(error)}`
}
