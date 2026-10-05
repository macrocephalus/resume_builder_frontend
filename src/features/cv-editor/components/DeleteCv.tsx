import { useNavigate } from 'react-router'
import { errorText } from '@/shared/api/errorText'
import { paths } from '@/shared/config/paths'
import { ConfirmButton } from '@/shared/ui/ConfirmButton'
import { Notice } from '@/shared/ui/Notice'
import { useDeleteCv } from '@/entities/cv/api/useDeleteCv'

/** Delete with the two-step confirm; once the CV is gone the screen goes back to My CVs. */
export function DeleteCv({ cvId }: { cvId: string }) {
  const navigate = useNavigate()
  const remove = useDeleteCv({ onDeleted: () => navigate(paths.cvList(), { replace: true }) })

  return (
    <div className="flex flex-col items-start gap-2">
      <ConfirmButton
        confirmLabel="Delete for good"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(cvId)}
      >
        Delete
      </ConfirmButton>
      {remove.isError ? (
        <Notice tone="bad" role="alert">
          Could not delete this CV. {errorText(remove.error)}
        </Notice>
      ) : null}
    </div>
  )
}
