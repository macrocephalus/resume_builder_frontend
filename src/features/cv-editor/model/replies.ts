import type { AnswerDraft } from '@/features/cv-editor/model/questions'

/** Why the answer was not sent although the request never started. */
export const notSentText = {
  'not-saved': 'Not sent: your edits could not be saved. Save them, then answer again.',
  invalid: 'Not sent: fix the marked fields in the editor first.',
} as const

/** How a reply ended before or when it was sent. */
export type ReplyOutcome = 'sent' | keyof typeof notSentText

/** The answers and skips of the CV screen, kept above the form so a remount keeps them. */
export type ReplyState = {
  /** The question whose answer or skip is on the way. */
  sendingId: string | null
  /** The question whose last answer or skip failed, and why. */
  failed: { questionId: string; message: string } | null
  /** A reply found its question closed or gone; the CV was fetched again. */
  gone: boolean
  /** What each card holds so far, by question id. */
  drafts: Record<string, AnswerDraft>
  onDraftChange: (questionId: string, draft: AnswerDraft) => void
}
