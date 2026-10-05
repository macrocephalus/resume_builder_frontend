import type { Answer, Cv, Question } from '@cv/shared'
import { Disclosure } from '@/shared/ui/Disclosure'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { QuestionCard } from '@/features/cv-editor/components/questions/QuestionCard'
import { questionGoneText } from '@/features/cv-editor/model/questionErrors'
import { answerText } from '@/features/cv-editor/model/questions'
import type { ReplyOutcome, ReplyState } from '@/features/cv-editor/model/replies'

type QuestionsPanelProps = {
  cv: Cv
  onReply: (question: Question, answer: Answer | null) => Promise<ReplyOutcome>
  replies: ReplyState
  /** A save is on the way. */
  saving: boolean
}

/** The open questions as cards, and the closed ones folded away. */
export function QuestionsPanel({ cv, onReply, replies, saving }: QuestionsPanelProps) {
  const open = cv.questions.filter((question) => question.status === 'open')
  const closed = cv.questions.filter((question) => question.status !== 'open')

  return (
    <section aria-labelledby="cv-questions-heading" className="flex flex-col gap-3">
      <h2 id="cv-questions-heading" className="sr-only">
        Questions
      </h2>
      {replies.gone ? (
        <Notice tone="wait" role="alert">
          {questionGoneText}
        </Notice>
      ) : null}
      {open.length === 0 ? (
        <Notice tone="ok">No open questions. Check the CV and download the PDF.</Notice>
      ) : null}
      {open.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onReply={onReply}
          sending={replies.sendingId === question.id}
          locked={saving || (replies.sendingId !== null && replies.sendingId !== question.id)}
          draft={replies.drafts[question.id] ?? {}}
          onDraftChange={(draft) => replies.onDraftChange(question.id, draft)}
          error={replies.failed?.questionId === question.id ? replies.failed.message : null}
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
    </section>
  )
}
