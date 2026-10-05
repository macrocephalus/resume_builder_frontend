// The fake worker: one worker for every user, taking queued CVs in order. A CV's status is a
// function of the clock, so it keeps progressing across reloads and needs no timers of its own.
// Handlers call `runWorker` before they read.

import type { CvStatus, GenerationStage } from '@cv/shared'
import { generatedDraft } from '@/mocks/fixtures/draft'
import type { MockCv, MockJob, Scenario } from '@/mocks/store'

/**
 * A generation takes about 14 s. A stage lasts as long as one polling interval and starts half
 * way between two polls, so each poll sees the next stage.
 */
export const WORKER_TIMING = {
  /** the least time in the queue, even when the worker is free */
  queued: 1500,
  /** each of the four stages */
  stage: 3000,
  /** the backoff before a retried attempt */
  backoff: 2000,
}

const STAGES: GenerationStage[] = ['drafting', 'verifying', 'revising', 'saving']

/** The outcome is picked by a keyword in the target role, so every status can be shown on demand. */
export function scenarioFor(targetRole: string): Scenario {
  const role = targetRole.toLowerCase()
  if (role.includes('fail')) return 'fail'
  if (role.includes('retry')) return 'retry'
  if (role.includes('ready')) return 'ready'
  return 'questions'
}

/** How long the worker is busy with a job of this scenario. */
function duration(scenario: Scenario): number {
  const { stage, backoff } = WORKER_TIMING
  if (scenario === 'fail') return 2 * stage
  if (scenario === 'retry') return stage + backoff + STAGES.length * stage
  return STAGES.length * stage
}

type Phase =
  | {
      status: Extract<CvStatus, 'generating' | 'retrying'>
      stage: GenerationStage | null
      attempt: number
    }
  | { status: 'failed' }
  | { status: 'done' }

/** Where a job is `t` ms after the worker took it. */
function phaseAt(t: number, scenario: Scenario): Phase {
  const { stage, backoff } = WORKER_TIMING
  const stageAt = (time: number) => STAGES[Math.floor(time / stage)] ?? null

  if (scenario === 'fail') {
    // The first two stages run, then the AI service gives up.
    return t < 2 * stage
      ? { status: 'generating', stage: stageAt(t), attempt: 1 }
      : { status: 'failed' }
  }
  let attempt = 1
  if (scenario === 'retry') {
    if (t < stage) return { status: 'generating', stage: 'drafting', attempt: 1 }
    if (t < stage + backoff) return { status: 'retrying', stage: null, attempt: 1 }
    t -= stage + backoff
    attempt = 2
  }
  return t < STAGES.length * stage
    ? { status: 'generating', stage: stageAt(t), attempt }
    : { status: 'done' }
}

function finish(entry: MockCv, job: MockJob): void {
  if (job.scenario === 'fail') {
    entry.cv = {
      ...entry.cv,
      status: 'failed',
      stage: null,
      queuePosition: null,
      errorCode: 'LLM_UNAVAILABLE',
      error: 'The AI service is unavailable right now. Try again in a few minutes.',
    }
  } else {
    const draft = generatedDraft({ withQuestions: job.scenario !== 'ready' })
    entry.cv = {
      ...entry.cv,
      ...draft,
      status: draft.questions.length > 0 ? 'needs_input' : 'ready',
      stage: null,
      queuePosition: null,
      version: entry.cv.version + 1,
    }
  }
  delete entry.job
}

type Snapshot = Pick<MockCv['cv'], 'status' | 'stage' | 'attempt' | 'queuePosition'>

const snapshot = ({ status, stage, attempt, queuePosition }: MockCv['cv']): Snapshot => ({
  status,
  stage,
  attempt,
  queuePosition,
})

/** Moves every CV with a job to where it should be at `now`. */
export function runWorker(cvs: MockCv[], now: number): void {
  const jobs = cvs
    .flatMap((entry) => (entry.job ? [{ entry, job: entry.job }] : []))
    .sort((a, b) => a.job.queuedAt - b.job.queuedAt)

  // The worker is free once the job it took last is over.
  let freeAt = 0
  let waiting = 0
  for (const { entry, job } of jobs) {
    const before = JSON.stringify(snapshot(entry.cv))
    const ready = job.queuedAt + WORKER_TIMING.queued
    job.startedAt ??= Math.max(ready, freeAt) <= now ? Math.max(ready, freeAt) : undefined

    if (job.startedAt === undefined) {
      // Still queued: the position counts every user's CVs queued earlier.
      waiting += 1
      entry.cv = { ...entry.cv, status: 'queued', stage: null, queuePosition: waiting }
    } else {
      freeAt = job.startedAt + duration(job.scenario)
      const phase = phaseAt(now - job.startedAt, job.scenario)
      if (phase.status === 'failed' || phase.status === 'done') finish(entry, job)
      else entry.cv = { ...entry.cv, ...phase, queuePosition: null }
    }

    if (JSON.stringify(snapshot(entry.cv)) !== before)
      entry.cv.updatedAt = new Date(now).toISOString()
  }
}
