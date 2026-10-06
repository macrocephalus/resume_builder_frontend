import { useSearchParams } from 'react-router'
import { CreateCvForm } from '@/features/cv-create/components/CreateCvForm'
import { CreateFromCv } from '@/features/cv-create/components/CreateFromCv'
import { readPrefill } from '@/features/cv-create/model/createForm'

/** New CV: from the user's own text, or for another role from a CV they have ("Also fits"). */
export function CvCreateScreen() {
  const [searchParams] = useSearchParams()
  const { fromCvId, role } = readPrefill(searchParams)

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1>New CV</h1>
      {fromCvId ? (
        // Keyed, so following another chip starts a fresh form.
        <CreateFromCv key={`${fromCvId}:${role}`} fromCvId={fromCvId} role={role} />
      ) : (
        <CreateCvForm key={role} role={role} />
      )}
    </div>
  )
}
