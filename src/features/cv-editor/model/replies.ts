import type { Answer, Question, Reply } from '@cv/shared'
import type { AnswerDraft } from '@/features/cv-editor/model/questions'
import type { SaveFirstOutcome } from '@/features/cv-editor/model/saveErrors'

/** Why the batch was not sent although the request never started. */
export const notSentText: Record<Exclude<SaveFirstOutcome, 'saved'>, string> = {
  'not-saved': 'Not applied: your edits could not be saved. Save them, then apply again.',
  invalid: 'Not applied: fix the marked fields in the editor first.',
}

/** How a batch ended before or when it was sent. */
export type ReplyOutcome = 'sent' | Exclude<SaveFirstOutcome, 'saved'>

/** The replied cards, by question id: an answer, or `null` for a skip. */
export type Replied = Record<string, Answer | null>

/** The replies of the open questions, in the order of the list; closed ones are left out. */
export const repliesFor = (questions: readonly Question[], replied: Replied): Reply[] =>
  questions
    .filter((question) => question.status === 'open' && Object.hasOwn(replied, question.id))
    .map((question) => ({ questionId: question.id, answer: replied[question.id] ?? null }))

/** The entries without these ids. */
export const without = <T>(entries: Record<string, T>, ids: readonly string[]): Record<string, T> =>
  Object.fromEntries(Object.entries(entries).filter(([id]) => !ids.includes(id)))

const SUMMARY_LENGTH = 80

const shorten = (text: string) =>
  text.length > SUMMARY_LENGTH ? `${text.slice(0, SUMMARY_LENGTH - 1).trimEnd()}…` : text

/** A replied card's one line: "Skipped", "Yes" / "No", the text, the picked options. */
export function replySummary(answer: Answer | null): string {
  if (answer === null) return 'Skipped'
  switch (answer.kind) {
    case 'confirm':
      return answer.value ? 'Yes' : 'No'
    case 'text':
      return shorten(answer.value)
    case 'choice':
      return shorten(answer.value ?? answer.other ?? '')
    case 'multi':
      return shorten([...answer.values, ...(answer.other ? [answer.other] : [])].join(', '))
  }
}

const replies = (count: number) => `${count} ${count === 1 ? 'reply' : 'replies'}`

export const applyLabel = (count: number) => `Apply ${replies(count)}`

export const appliedText = (count: number) => `${replies(count)} applied`

/** The replies of the CV screen, kept above the form so a remount keeps them. */
export type ReplyState = {
  /** What each card holds so far, by question id. */
  drafts: Record<string, AnswerDraft>
  onDraftChange: (questionId: string, draft: AnswerDraft) => void
  /** The replied and skipped cards, not applied yet. */
  replied: Replied
  /** Marks a card replied with an answer, or skipped with `null`; nothing is sent. */
  onReply: (questionId: string, answer: Answer | null) => void
  /** Opens a replied card again, with its draft as it was. */
  onChange: (questionId: string) => void
  /** Turns every card back to open; the drafts stay. */
  onClear: () => void
  /** The batch is on its way. */
  applying: boolean
  /** Why the last batch was not applied, for the bar. */
  error: string | null
  /** The replies the server refused in the last batch, by question id. */
  refused: Record<string, string>
  /** How many replies the last batch applied, for a moment after. */
  applied: number | null
}
