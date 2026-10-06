import { Download } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useFormState } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { Notice } from '@/shared/ui/Notice'
import { PdfGaps } from '@/features/cv-editor/components/pdf/PdfGaps'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'
import { downloadErrorText, isPdfGone, notDownloadedText } from '@/features/cv-editor/model/pdf'
import type { SaveFirstOutcome } from '@/features/cv-editor/model/saveErrors'

type DownloadPdfProps = {
  /** The download, kept above the form: a save before it remounts the form. */
  pdf: { isPending: boolean; error: unknown }
  /** Saves unsaved edits first, then starts the download. */
  onDownload: () => Promise<SaveFirstOutcome>
  openQuestions: number
}

/**
 * Download PDF, or "Save & download" while there are unsaved edits: the PDF is made from the
 * saved draft. It reads only whether the form is dirty, so typing re-renders the button only when
 * that changes.
 */
export function DownloadPdf({ pdf, onDownload, openQuestions }: DownloadPdfProps) {
  const { isDirty } = useFormState<DraftFormValues>()
  const [notSaved, setNotSaved] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const start = () =>
    startSaving(async () => {
      setNotSaved(null)
      const outcome = await onDownload()
      if (outcome !== 'saved') setNotSaved(notDownloadedText[outcome])
    })

  return (
    <div className="flex flex-col gap-2">
      <Button className="self-start" pending={saving || pdf.isPending} onClick={start}>
        <Download size={16} aria-hidden="true" />
        {pdf.isPending ? 'Preparing PDF…' : isDirty ? 'Save & download' : 'Download PDF'}
      </Button>
      <PdfGaps openQuestions={openQuestions} />
      {notSaved ? (
        <Notice tone="bad" role="alert">
          {notSaved}
        </Notice>
      ) : pdf.error ? (
        <Notice
          tone="bad"
          role="alert"
          action={
            isPdfGone(pdf.error) ? null : (
              <Button variant="secondary" size="sm" onClick={start}>
                Try again
              </Button>
            )
          }
        >
          {downloadErrorText(pdf.error)}
        </Notice>
      ) : null}
    </div>
  )
}
