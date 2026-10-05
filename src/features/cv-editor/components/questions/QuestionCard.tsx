import type { Answer, Question } from '@cv/shared'
import { useId, useState, useTransition } from 'react'
import { Button } from '@/shared/ui/Button'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { Panel } from '@/shared/ui/Panel'
import { AnswerControls } from '@/features/cv-editor/components/questions/AnswerControls'
import { answerBody, questionTarget, type AnswerDraft } from '@/features/cv-editor/model/questions'
import { notSentText, type ReplyOutcome } from '@/features/cv-editor/model/replies'

type QuestionCardProps = {
  question: Question
  /** Saves unsaved edits first, then sends the answer, or skips with `null`. */
  onReply: (question: Question, answer: Answer | null) => Promise<ReplyOutcome>
  /** Its answer or skip is on the way. */
  sending: boolean
  /** Another reply or a save is on the way: one thing at a time. */
  locked: boolean
  /** What the card holds so far; kept above the form, so a remount after a save keeps it. */
  draft: AnswerDraft
  onDraftChange: (draft: AnswerDraft) => void
  /** Why its last answer or skip failed. */
  error: string | null
}

/** One open question: what it is about, the answer controls, Answer and Skip. */
export function QuestionCard({
  question,
  onReply,
  sending,
  locked,
  draft,
  onDraftChange,
  error,
}: QuestionCardProps) {
  const headingId = useId()
  const [notSent, setNotSent] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()
  const busy = sending || saving || locked
  const answer = answerBody(question, draft)

  const reply = (body: Answer | null) =>
    startSaving(async () => {
      setNotSent(null)
      const outcome = await onReply(question, body)
      if (outcome !== 'sent') setNotSent(notSentText[outcome])
    })

  return (
    <Panel aria-labelledby={headingId} className="flex flex-col gap-3 p-4">
      <MetaLine>{questionTarget(question)}</MetaLine>
      <h3 id={headingId}>{question.text}</h3>
      {question.kind === 'confirm' ? (
        <>
          <Notice tone="wait">
            <blockquote>“{question.claim}”</blockquote>
          </Notice>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              pending={busy}
              onClick={() => reply({ kind: 'confirm', value: true })}
            >
              Yes, add it
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => reply({ kind: 'confirm', value: false })}
            >
              No
            </Button>
          </div>
        </>
      ) : (
        <>
          <AnswerControls question={question} draft={draft} onChange={onDraftChange} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              pending={busy}
              disabled={!answer}
              onClick={() => answer && reply(answer)}
            >
              Answer
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => reply(null)}>
              Skip
            </Button>
          </div>
        </>
      )}
      {(notSent ?? error) ? (
        <Notice tone="bad" role="alert">
          {notSent ?? error}
        </Notice>
      ) : null}
    </Panel>
  )
}
