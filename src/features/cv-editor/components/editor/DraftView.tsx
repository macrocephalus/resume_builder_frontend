import type { Cv, PatchCvBody } from '@cv/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useTransition } from 'react'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import {
  loadStoredReplies,
  onlyOpen,
  saveStoredReplies,
  storedRepliesKey,
  type StoredReplies,
} from '@/entities/cv/model/storedReplies'
import { useApplyReplies } from '@/features/cv-editor/api/useApplyReplies'
import { useDownloadPdf } from '@/features/cv-editor/api/useDownloadPdf'
import { useSaveCv } from '@/features/cv-editor/api/useSaveCv'
import { DraftEditor } from '@/features/cv-editor/components/editor/DraftEditor'
import {
  applyErrorText,
  closedByEditsText,
  isQuestionGone,
  refusedReplies,
} from '@/features/cv-editor/model/questionErrors'
import { repliesFor, without, type ReplyState } from '@/features/cv-editor/model/replies'

/** How long "N replies applied" stays on screen. */
const APPLIED_NOTICE_MS = 4000

/**
 * The CV screen for a CV with a draft. The save, the replies and the download live here, above
 * the form, so "Saved ✓", their pending state, their errors and what each question card holds
 * outlive the remount that a new version causes.
 */
export function DraftView({ cv, userId }: { cv: Cv; userId: string }) {
  const queryClient = useQueryClient()
  const save = useSaveCv(cv.id)
  const [reloading, startReload] = useTransition()
  const [reloadError, setReloadError] = useState<unknown>(null)
  // Counts discards, so a discard mounts a fresh form like a new version does.
  const [discards, setDiscards] = useState(0)

  const pdf = useDownloadPdf(cv.id)
  const apply = useApplyReplies(cv.id)
  // The cards' drafts and replies, kept in the browser too, so a reload loses nothing.
  const storageKey = storedRepliesKey(userId, cv.id)
  const [kept, setKept] = useState<StoredReplies>(() => loadStoredReplies(storageKey, cv.questions))
  useEffect(() => {
    saveStoredReplies(storageKey, kept)
  }, [storageKey, kept])
  const [refused, setRefused] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<number | null>(null)
  // The save before a batch closed every replied question: nothing was sent. Kept up here, since
  // that save remounts the panel.
  const [closedByEdits, setClosedByEdits] = useState(false)

  const saveEdits = (body: PatchCvBody) => {
    apply.reset()
    setClosedByEdits(false)
    // A failed download was about the version before; the button stays to try again.
    pdf.reset()
    save.mutate(body)
  }

  const sendReplies = () => {
    // The save before this may have closed questions (an item removed), so the batch is built
    // from the CV as it is now.
    const latest = queryClient.getQueryData(cvQueries.detail(cv.id).queryKey) ?? cv
    const batch = repliesFor(latest.questions, kept.replied)
    if (batch.length === 0) {
      // The replies of the closed questions go, and the bar says why nothing was sent.
      setKept((current) => ({
        drafts: onlyOpen(current.drafts, latest.questions),
        replied: onlyOpen(current.replied, latest.questions),
      }))
      setClosedByEdits(true)
      return
    }
    setClosedByEdits(false)
    setRefused({})
    apply.mutate(batch, {
      onSuccess: (next) => {
        setKept((current) => ({
          drafts: onlyOpen(current.drafts, next.questions),
          replied: onlyOpen(current.replied, next.questions),
        }))
        setApplied(batch.length)
        window.setTimeout(() => setApplied(null), APPLIED_NOTICE_MS)
      },
      onError: (error) => {
        // After a 409 the CV was fetched again (refreshWhenClosed): the replies of questions no
        // longer open go. A refused reply opens its card again, with the server's message.
        const fresh = queryClient.getQueryData(cvQueries.detail(cv.id).queryKey)
        // No CV any more (deleted elsewhere): the screen turns to Not found, nothing to keep.
        if (!fresh && isQuestionGone(error)) return
        const refusedNow = refusedReplies(error, batch)
        setRefused(refusedNow)
        setKept((current) => ({
          ...current,
          replied: without(
            fresh ? onlyOpen(current.replied, fresh.questions) : current.replied,
            Object.keys(refusedNow),
          ),
        }))
      },
    })
  }

  const replies: ReplyState = {
    drafts: kept.drafts,
    replied: kept.replied,
    onDraftChange: (questionId, draft) =>
      setKept((current) => ({ ...current, drafts: { ...current.drafts, [questionId]: draft } })),
    onReply: (questionId, answer) => {
      apply.reset()
      setClosedByEdits(false)
      setRefused((current) => without(current, [questionId]))
      setKept((current) => ({ ...current, replied: { ...current.replied, [questionId]: answer } }))
    },
    onChange: (questionId) => {
      apply.reset()
      setClosedByEdits(false)
      setKept((current) => ({ ...current, replied: without(current.replied, [questionId]) }))
    },
    onClear: () => {
      apply.reset()
      setClosedByEdits(false)
      setRefused({})
      setKept((current) => ({ ...current, replied: {} }))
    },
    applying: apply.isPending,
    error: apply.error
      ? applyErrorText(apply.error, apply.variables ?? [])
      : closedByEdits
        ? closedByEditsText
        : null,
    refused,
    applied,
  }

  const discard = () => {
    save.reset()
    pdf.reset()
    apply.reset()
    setClosedByEdits(false)
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
        onApply={sendReplies}
        replies={replies}
        pdf={pdf}
        onDownload={() => pdf.mutate()}
      />
    </div>
  )
}
