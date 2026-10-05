import type { Cv } from '@cv/shared'
import { Panel } from '@/shared/ui/Panel'
import { CvHeader } from '@/features/cv-editor/components/CvHeader'
import { DeleteCv } from '@/features/cv-editor/components/DeleteCv'

const questions = (count: number) => (count === 1 ? '1 question' : `${count} questions`)

// Ticket 07 replaces this with the editor.
export function DraftPlaceholder({ cv }: { cv: Cv }) {
  const open = cv.questions.filter((question) => question.status === 'open').length

  return (
    <Panel className="flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <CvHeader cv={cv} />
      <p>
        Your draft is ready
        {open > 0 ? `, with ${questions(open)} about what your text did not say` : ''}. The editor
        comes next.
      </p>
      <DeleteCv cvId={cv.id} />
    </Panel>
  )
}
