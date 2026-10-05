import { answerSchemaFor, type Answer, type Cv, type Question } from '@cv/shared'
import { sectionTitles } from '@/features/cv-editor/model/blocks'

/** The "Other" choice of a `choice` question, next to its options. */
export const OTHER = '\u0000other'

/** What a card has collected so far: typed text, picked options, the "Other" text. */
export type AnswerDraft = { text?: string; picked?: string[]; other?: string }

/** Which part of the CV a question is about: "Contacts · Phone", "Skills". */
export function questionTarget({ target, label }: Pick<Question, 'target' | 'label'>): string {
  const section = sectionTitles[target.section]
  return label && label !== section ? `${section} · ${label}` : section
}

/**
 * The answer body for what the card holds, or `null` while it is not a valid answer for the
 * question's kind (checked with the contract's `answerSchemaFor`).
 */
export function answerBody(question: Question, draft: AnswerDraft): Answer | null {
  const picked = draft.picked ?? []
  const other = draft.other?.trim() || undefined
  let body: unknown
  switch (question.kind) {
    case 'text':
      body = { kind: 'text', value: draft.text?.trim() }
      break
    case 'choice':
      body = picked[0] === OTHER ? { kind: 'choice', other } : { kind: 'choice', value: picked[0] }
      break
    case 'multi':
      body = { kind: 'multi', values: picked, ...(other ? { other } : {}) }
      break
    case 'confirm':
      return null
  }
  const parsed = answerSchemaFor(question).safeParse(body)
  return parsed.success ? parsed.data : null
}

/** A closed question's answer, for the "Answered" list. */
export function answerText({ status, kind, answer, claim }: Question): string {
  if (status === 'skipped') return 'Skipped'
  if (kind === 'confirm') return `${answer === true ? 'Added' : 'Left out'}: ${claim ?? ''}`
  if (Array.isArray(answer)) return answer.join(', ')
  return typeof answer === 'string' ? answer : ''
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * The fact check's report as one sentence (docs/architecture.md §6.6 at the repo root); parts that
 * did not happen are left out.
 */
export function verificationText(report: NonNullable<Cv['verification']>): string {
  const parts = [
    report.verified === 1
      ? '1 bullet confirmed by a quote from your text'
      : `${report.verified} bullets confirmed by quotes from your text`,
    report.sentToConfirm > 0 ? `${report.sentToConfirm} sent to you to confirm` : null,
    report.skillsToConfirm > 0
      ? `${count(report.skillsToConfirm, 'skill', 'skills')} moved to suggestions`
      : null,
    report.cleared > 0
      ? `${count(report.cleared, 'unconfirmed field', 'unconfirmed fields')} cleared and asked about`
      : null,
  ]
  return `${parts.filter((part) => part !== null).join(', ')}.`
}
