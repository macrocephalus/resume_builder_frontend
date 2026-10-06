import type { IngestedPdf } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { extractedText } from '@/features/cv-create/model/pdfText'

const pdf = (text: string, pages = 2): IngestedPdf => ({
  text,
  pages,
  chars: text.length,
  filename: 'olena-cv.pdf',
})

describe('extractedText', () => {
  test('a text a CV can start from: how much was read, and a nudge to check it', () => {
    expect(extractedText(pdf('x'.repeat(3120)))).toEqual({
      fits: true,
      text: 'Extracted 3 120 characters from 2 pages of olena-cv.pdf. Check them below; the AI reads exactly this text.',
    })
  })

  test('a text over the limit asks to shorten it', () => {
    expect(extractedText(pdf('x'.repeat(24_500), 9))).toEqual({
      fits: false,
      text: 'Extracted 24 500 characters from 9 pages of olena-cv.pdf, more than the 20 000 a CV can start from. Shorten the text below to fit: keep your recent roles and cut what is old or repeated.',
    })
  })

  test('a text under the minimum asks for more', () => {
    expect(extractedText(pdf('x'.repeat(62), 1))).toEqual({
      fits: false,
      text: 'Extracted only 62 characters from 1 page of olena-cv.pdf, fewer than the 80 a CV needs. Add more below: roles, companies, dates, what you did.',
    })
  })

  test('the limits apply to the text as it is sent: trimmed', () => {
    expect(extractedText(pdf(`  ${'x'.repeat(79)}\n\n`)).fits).toBe(false)
    expect(extractedText(pdf(`${'x'.repeat(20_000)}\n`)).fits).toBe(true)
  })
})
