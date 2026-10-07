import { isInProgress } from '@cv/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cvQueries } from '@/entities/cv/api/cvQueries'
import { useCvStatusPolling } from '@/entities/cv/api/useCvStatusPolling'
import { DraftView } from '@/features/cv-editor/components/editor/DraftView'
import { FailedPanel } from '@/features/cv-editor/components/progress/FailedPanel'
import { ProgressPanel } from '@/features/cv-editor/components/progress/ProgressPanel'

/**
 * The CV screen: the panel is picked by the status group (docs/cv-statuses.md). The user's id
 * keys the replies the browser keeps for this CV.
 */
export function CvScreen({ cvId, userId }: { cvId: string; userId: string }) {
  const { data: cv } = useSuspenseQuery(cvQueries.detail(cvId))
  const inProgress = isInProgress(cv.status)
  useCvStatusPolling(inProgress ? [cv.id] : [])

  if (inProgress) return <ProgressPanel cv={cv} />
  if (cv.status === 'failed') return <FailedPanel cv={cv} />
  return <DraftView cv={cv} userId={userId} />
}
