import { useSuspenseQuery } from '@tanstack/react-query'
import { paths } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ListPanel } from '@/shared/ui/ListPanel'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { CvRow } from '@/features/cv-list/components/CvRow'

export function CvListScreen() {
  const { data: cvs } = useSuspenseQuery(cvQueries.list())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="grow">My CVs</h1>
        {cvs.length > 0 ? <ButtonLink to={paths.newCv()}>New CV</ButtonLink> : null}
      </div>
      {cvs.length === 0 ? (
        <EmptyState
          title="No CVs yet"
          action={<ButtonLink to={paths.newCv()}>Create your first CV</ButtonLink>}
        >
          To start, you need your experience, as a PDF of your CV or a few lines in your own words,
          and the title of the role you want.
        </EmptyState>
      ) : (
        <ListPanel aria-label="My CVs">
          {cvs.map((cv) => (
            <CvRow key={cv.id} cv={cv} />
          ))}
        </ListPanel>
      )}
    </div>
  )
}
