import { findMissing, ITEM_SECTIONS, type CvSection, type ItemSection } from '@cv/shared'
import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'
import { formatList } from '@/shared/lib/format'
import { itemBlocks, sectionTitles } from '@/features/cv-editor/model/blocks'
import { toCvData, type DraftFormValues } from '@/features/cv-editor/model/draftForm'
import type { SaveFirstOutcome } from '@/features/cv-editor/model/saveErrors'

/** Why the download did not start: the edits had to be saved first, and were not. */
export const notDownloadedText: Record<Exclude<SaveFirstOutcome, 'saved'>, string> = {
  'not-saved': 'Not downloaded: your edits could not be saved. The save bar says why.',
  invalid: 'Not downloaded: fix the marked fields in the editor first.',
}

/** `409 INVALID_STATE`: the CV has no draft any more, so trying again cannot help. */
export const isPdfGone = (error: unknown) =>
  error instanceof ApiError && error.code === 'INVALID_STATE'

/** Why fetching the PDF failed, next to the button. */
export function downloadErrorText(error: unknown): string {
  return isPdfGone(error)
    ? 'This CV has no draft to download. Reload the page.'
    : `Could not download the PDF. ${errorText(error)}`
}

const isItemSection = (section: CvSection): section is ItemSection =>
  (ITEM_SECTIONS as readonly string[]).includes(section)

/**
 * What the PDF of these values will lack, by the contract's missing rule (`findMissing`), in
 * words: "full name", "email or phone", "summary", "company and period of job 2".
 */
export function pdfGaps(form: DraftFormValues): string[] {
  const missing = findMissing(toCvData(form))
  const gaps: string[] = []
  const namedItems = new Set<string>()

  for (const { section, itemId, field } of missing) {
    if (section === 'contacts') {
      if (field === 'fullName') gaps.push('full name')
      // The rule reports both when neither is given: either one would do.
      else if (field === 'email') gaps.push('email or phone')
    } else if (itemId && isItemSection(section)) {
      if (namedItems.has(itemId)) continue
      namedItems.add(itemId)
      const block = itemBlocks[section]
      const fields = missing
        .filter((part) => part.itemId === itemId)
        .map(({ field: name }) =>
          (block.fields.find((config) => config.name === name)?.label ?? name ?? '').toLowerCase(),
        )
      const number = form[section].findIndex((item) => item.itemId === itemId) + 1
      gaps.push(`${formatList(fields)} of ${block.itemName.toLowerCase()} ${number}`)
    } else {
      gaps.push(sectionTitles[section].toLowerCase())
    }
  }
  return gaps
}
