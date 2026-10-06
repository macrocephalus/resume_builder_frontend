import type { Answer, Cv, PatchCvBody } from '@cv/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { useAnswerQuestion } from '@/features/cv-editor/api/useAnswerQuestion'
import { useDownloadPdf } from '@/features/cv-editor/api/useDownloadPdf'
import { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import { useSkipQuestion } from '@/features/cv-editor/api/useSkipQuestion'
import { DraftEditor } from '@/features/cv-editor/components/editor/DraftEditor'
import { isQuestionGone, replyErrorText } from '@/features/cv-editor/model/questionErrors'
import type { AnswerDraft } from '@/features/cv-editor/model/questions'
import type { ReplyState } from '@/features/cv-editor/model/replies'

/**
 * The CV screen for a CV with a draft. The save, answer, skip and download live here, above the
 * form, so "Saved ✓", their pending state and their errors outlive the remount that a new version
 * causes.
 */
export function DraftView({ cv }: { cv: Cv }) {
  const queryClient = useQueryClient()
  const save = useSaveCv(cv.id)
  const [reloading, startReload] = useTransition()
  const [reloadError, setReloadError] = useState<unknown>(null)
  // Counts discards, so a discard mounts a fresh form like a new version does.
  const [discards, setDiscards] = useState(0)

  const pdf = useDownloadPdf(cv.id)
  const answer = useAnswerQuestion(cv.id)
  const skip = useSkipQuestion(cv.id)
  // What each question card holds; up here, a remount after a save does not lose it.
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>({})
  const forgetReplies = () => {
    answer.reset()
    skip.reset()
  }
  const send = (questionId: string, body: Answer | null) => {
    forgetReplies()
    if (body) answer.mutate({ questionId, answer: body })
    else skip.mutate(questionId)
  }
  const saveEdits = (body: PatchCvBody) => {
    forgetReplies()
    // A failed download was about the version before; the button stays to try again.
    pdf.reset()
    save.mutate(body)
  }
  const replyError = answer.error ?? skip.error
  const replyId = answer.variables?.questionId ?? skip.variables ?? null
  const replies: ReplyState = {
    sendingId: answer.isPending || skip.isPending ? replyId : null,
    failed:
      replyError && replyId && !isQuestionGone(replyError)
        ? { questionId: replyId, message: replyErrorText(replyError) }
        : null,
    gone: isQuestionGone(replyError),
    drafts,
    onDraftChange: (questionId, draft) =>
      setDrafts((current) => ({ ...current, [questionId]: draft })),
  }

  const discard = () => {
    save.reset()
    pdf.reset()
    forgetReplies()
    setDiscards((count) => count + 1)
  }

  // After a conflict: fetch the newer version, which remounts the form with its values. The
  // notice stays until that worked.
  const reload = () =>
    startReload(async () => {
      try {
        await queryClient.refetchQueries(
          { queryKey: cvQueries.detail(cv.id).queryKey },
          { throwOnError: true },
        )
        setReloadError(null)
        save.reset()
      } catch (error) {
        setReloadError(error)
      }
    })

  return (
    <div className="flex flex-col gap-4">
      <DraftEditor
        key={`${cv.version}:${discards}`}
        cv={cv}
        save={save}
        onSave={saveEdits}
        reloading={reloading}
        reloadError={reloadError}
        onReload={reload}
        onDiscard={discard}
        onSend={send}
        replies={replies}
        pdf={pdf}
        onDownload={() => pdf.mutate()}
      />
    </div>
  )
}
