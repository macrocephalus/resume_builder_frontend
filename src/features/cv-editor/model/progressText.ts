import type { CvStatusInfo, GenerationStage } from '@cv/shared'

const stageText: Record<GenerationStage, string> = {
  drafting: 'Writing your CV',
  verifying: 'Checking facts against your source',
  revising: 'Fixing unconfirmed facts',
  saving: 'Saving',
}

/** What the in-progress panel says, in plain words, from the status fields (docs/cv-statuses.md). */
export function progressText(
  info: Pick<CvStatusInfo, 'status' | 'stage' | 'attempt' | 'maxAttempts' | 'queuePosition'>,
): string {
  switch (info.status) {
    case 'queued': {
      const ahead = (info.queuePosition ?? 1) - 1
      return ahead > 0 ? `${ahead} ahead of you in the queue` : 'Starting soon'
    }
    case 'generating': {
      const text = info.stage ? stageText[info.stage] : 'Generating'
      return info.attempt > 1 ? `${text} · attempt ${info.attempt} of ${info.maxAttempts}` : text
    }
    case 'retrying':
      return `Attempt ${info.attempt} of ${info.maxAttempts} failed, retrying…`
    default:
      return ''
  }
}
