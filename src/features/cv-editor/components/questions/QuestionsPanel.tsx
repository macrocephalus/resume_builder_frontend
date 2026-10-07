import type { Cv } from '@cv/shared'
import { useState, useTransition } from 'react'
import { Disclosure } from '@/shared/ui/Disclosure'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { ApplyBar } from '@/features/cv-editor/components/questions/ApplyBar'
import { QuestionCard } from '@/features/cv-editor/components/questions/QuestionCard'
import { answerText } from '@/features/cv-editor/model/questions'
import {
  appliedText,
  notSentText,
  repliesFor,
  type ReplyOutcome,
  type ReplyState,
} from '@/features/cv-editor/model/replies'

type QuestionsPanelProps = {
  cv: Cv
  replies: ReplyState
  /** Saves unsaved edits first, then sends every replied card in one request. */
  onApply: () => Promise<ReplyOutcome>
  /** A save is on the way. */
  saving: boolean
}

/**
 * The open questions as cards, the bar that applies the replied ones together, and the closed
 * questions folded away. Answer and Skip only mark a card; nothing is sent until Apply.
 */
export function QuestionsPanel({ cv, replies, onApply, saving }: QuestionsPanelProps) {
  const open = cv.questions.filter((question) => question.status === 'open')
  const closed = cv.questions.filter((question) => question.status !== 'open')
  const count = repliesFor(open, replies.replied).length
  const [notSent, setNotSent] = useState<string | null>(null)
  const [savingFirst, startApply] = useTransition()
  const locked = saving || savingFirst || replies.applying

  const apply = () =>
    startApply(async () => {
      setNotSent(null)
      const outcome = await onApply()
      if (outcome !== 'sent') setNotSent(notSentText[outcome])
    })

  const clear = () => {
    setNotSent(null)
    replies.onClear()
  }

  const barShown =
    count > 0 || savingFirst || replies.applying || notSent !== null || replies.error !== null

  return (
    <section aria-labelledby="cv-questions-heading" className="flex flex-col gap-3">
      <h2 id="cv-questions-heading" className="sr-only">
        Questions
      </h2>
      {replies.applied !== null ? (
        <Notice tone="ok">
          <output>{appliedText(replies.applied)}</output>
        </Notice>
      ) : null}
      {open.length === 0 ? (
        <Notice tone="ok">No open questions. Check the CV and download the PDF.</Notice>
      ) : null}
      {open.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          reply={replies.replied[question.id]}
          onReply={(answer) => replies.onReply(question.id, answer)}
          onChange={() => replies.onChange(question.id)}
          locked={locked}
          draft={replies.drafts[question.id] ?? {}}
          onDraftChange={(draft) => replies.onDraftChange(question.id, draft)}
          error={replies.refused[question.id] ?? null}
        />
      ))}
      {closed.length > 0 ? (
        <Disclosure summary={`Answered (${closed.length})`}>
          {closed.map((question) => (
            <div key={question.id} className="flex flex-col gap-0.5">
              <p>{question.text}</p>
              <MetaLine>
                <p>{answerText(question)}</p>
              </MetaLine>
            </div>
          ))}
        </Disclosure>
      ) : null}
      {barShown ? (
        <ApplyBar
          count={count}
          applying={savingFirst || replies.applying}
          error={notSent ?? replies.error}
          onApply={apply}
          onClear={clear}
        />
      ) : null}
    </section>
  )
}
