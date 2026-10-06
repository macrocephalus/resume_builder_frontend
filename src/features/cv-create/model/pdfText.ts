import { API_LIMITS, type IngestedPdf } from '@cv/shared'
import { formatCount } from '@/features/cv-create/model/createForm'

const { min, max } = API_LIMITS.sourceText

const pages = (count: number) => (count === 1 ? '1 page' : `${count} pages`)

/**
 * What the form says about the text of a PDF it just put in: how much was read and, when a CV
 * cannot start from it as it is, what to do. The upload takes up to 10 pages and checks no length
 * of its own, so a dense PDF can be over the limit of the text and a sparse one under it.
 */
export function extractedText({ text, chars, pages: count, filename }: IngestedPdf): {
  fits: boolean
  text: string
} {
  const from = `from ${pages(count)} of ${filename}`
  // The create body trims the text before it checks the length.
  const length = text.trim().length
  if (length > max) {
    return {
      fits: false,
      text: `Extracted ${formatCount(chars)} characters ${from}, more than the ${formatCount(max)} a CV can start from. Shorten the text below to fit: keep your recent roles and cut what is old or repeated.`,
    }
  }
  if (length < min) {
    return {
      fits: false,
      text: `Extracted only ${formatCount(chars)} characters ${from}, fewer than the ${min} a CV needs. Add more below: roles, companies, dates, what you did.`,
    }
  }
  return {
    fits: true,
    text: `Extracted ${formatCount(chars)} characters ${from}. Check them below; the AI reads exactly this text.`,
  }
}
