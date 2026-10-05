import type { CvStatus } from '@cv/shared'
import { Pill } from '@/shared/ui/Pill'
import { statusView } from '@/entities/cv/model/statusView'

export function StatusPill({ status }: { status: CvStatus }) {
  const { label, tone } = statusView[status]
  return <Pill tone={tone}>{label}</Pill>
}
