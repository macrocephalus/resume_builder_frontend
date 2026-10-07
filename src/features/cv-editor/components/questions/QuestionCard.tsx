import type { Answer, Question } from '@cv/shared'
import { useId } from 'react'
import { Button } from '@/shared/ui/Button'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { Panel } from '@/shared/ui/Panel'
import { AnswerControls } from '@/features/cv-editor/components/questions/AnswerControls'
import { answerBody, questionTarget, type AnswerDraft } from '@/features/cv-editor/model/questions'
import { replySummary } from '@/features/cv-editor/model/replies'

type QuestionCardProps = {
  question: Question
  /** Its reply so far: an answer, a skip (`null`) or none yet (`undefined`). */
  reply: Answer | null | undefined
  /** Marks the card replied with an answer, or skipped with `null`; nothing is sent. */
  onReply: (answer: Answer | null) => void
  /** Opens a replied card again, with its draft as it was. */
  onChange: () => void
  /** A save or the batch is on the way: the card waits. */
  locked: boolean
  /** What the card holds so far; kept above the form, so a remount after a save keeps it. */
  draft: AnswerDraft
  onDraftChange: (draft: AnswerDraft) => void
  /** Why the server refused its reply in the last batch. */
  error: string | null
}

/**
 * One open question: what it is about, the answer controls, Answer and Skip. Once replied it
 * folds to one line — the target, the reply in short and Change — until the batch is applied.
 */
export function QuestionCard({
  question,
  reply,
  onReply,
  onChange,
  locked,
  draft,
  onDraftChange,
  error,
}: QuestionCardProps) {
  const headingId = useId()
  const answer = answerBody(question, draft)

  if (reply !== undefined) {
    return (
      <Panel
        aria-labelledby={headingId}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 pr-1.5 pl-4"
      >
        <h3 id={headingId} className="sr-only">
          {question.text}
        </h3>
        <MetaLine>{questionTarget(question)}</MetaLine>
        <p className="min-w-0 grow break-words">{replySummary(reply)}</p>
        <Button variant="ghost" size="sm" disabled={locked} onClick={onChange}>
          Change
        </Button>
      </Panel>
    )
  }

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
              disabled={locked}
              onClick={() => onReply({ kind: 'confirm', value: true })}
            >
              Yes, add it
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={locked}
              onClick={() => onReply({ kind: 'confirm', value: false })}
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
              disabled={locked || !answer}
              onClick={() => answer && onReply(answer)}
            >
              Answer
            </Button>
            <Button variant="ghost" size="sm" disabled={locked} onClick={() => onReply(null)}>
              Skip
            </Button>
          </div>
        </>
      )}
      {error ? (
        <Notice tone="bad" role="alert">
          {error}
        </Notice>
      ) : null}
    </Panel>
  )
}
