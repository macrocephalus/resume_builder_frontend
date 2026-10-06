import type { IngestedPdf } from '@cv/shared'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { FileButton } from '@/shared/ui/FileButton'
import { MetaLine } from '@/shared/ui/MetaLine'
import { Notice } from '@/shared/ui/Notice'
import { useIngestPdf } from '@/features/cv-create/api/useIngestPdf'
import { formatCount } from '@/features/cv-create/model/createForm'
import { ingestErrorText, pdfLimits } from '@/features/cv-create/model/ingestErrors'
import { extractedText } from '@/features/cv-create/model/pdfText'

type PdfUploadProps = {
  /** Whether the text area already holds text, which an upload must not replace unasked. */
  hasText: () => boolean
  /** Puts the extracted text into the form. */
  onUse: (pdf: IngestedPdf) => void
}

/** What happened to the last extracted text. */
type Step = 'idle' | 'confirm' | 'used' | 'kept'

export function PdfUpload({ hasText, onUse }: PdfUploadProps) {
  const ingest = useIngestPdf()
  const [step, setStep] = useState<Step>('idle')
  const pdf = ingest.data
  const note = pdf ? extractedText(pdf) : null

  const upload = (file: File) => {
    setStep('idle')
    ingest.mutate(file, {
      onSuccess: (extracted) => {
        if (hasText()) {
          setStep('confirm')
        } else {
          onUse(extracted)
          setStep('used')
        }
      },
    })
  }

  const use = (extracted: IngestedPdf) => {
    onUse(extracted)
    setStep('used')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <FileButton accept="application/pdf,.pdf" pending={ingest.isPending} onFile={upload}>
          Upload PDF
        </FileButton>
        <MetaLine>
          <span>Your CV as a PDF with text, {pdfLimits}</span>
        </MetaLine>
      </div>
      {ingest.isError ? (
        <Notice tone="bad" role="alert">
          {ingestErrorText(ingest.error)}
        </Notice>
      ) : null}
      {pdf && step === 'confirm' ? (
        <Notice
          tone="wait"
          role="alert"
          action={
            <span className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => use(pdf)}>
                Replace
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStep('kept')}>
                Keep my text
              </Button>
            </span>
          }
        >
          Replace the text below with the {formatCount(pdf.chars)} characters from {pdf.filename}?
        </Notice>
      ) : null}
      {note && step === 'used' ? (
        <Notice tone={note.fits ? 'accent' : 'wait'} aria-live="polite">
          {note.text}
        </Notice>
      ) : null}
    </div>
  )
}
