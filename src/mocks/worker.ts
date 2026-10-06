// The fake worker: one worker for every user, taking queued CVs in order. A CV's status is a
// function of the clock, so it keeps progressing across reloads and needs no timers of its own.
// Handlers call `runWorker` before they read.

import type { CvStatus, GenerationStage } from '@cv/shared'
import { generatedDraft } from '@/mocks/fixtures/draft'
import type { MockCv, MockJob, Scenario } from '@/mocks/store'

/**
 * A stage lasts as long as one polling interval and starts half way between two polls, so each
 * poll sees the next stage. A generation takes 9 to 20 s, by scenario, after at least 1.5 s in
 * the queue.
 */
export const WORKER_TIMING = {
  /** the least time in the queue, even when the worker is free */
  queued: 1500,
  /** each stage */
  stage: 3000,
  /** the wait before the second attempt */
  backoff: 2000,
}

/** The outcome is picked by a keyword in the target role, so every status can be shown on demand. */
export function scenarioFor(targetRole: string): Scenario {
  const role = targetRole.toLowerCase()
  if (role.includes('fail')) return 'fail'
  if (role.includes('retry')) return 'retry'
  if (role.includes('ready')) return 'ready'
  return 'questions'
}

/** One attempt: the stages it goes through, and whether it fails at the end of them. */
type Attempt = { stages: GenerationStage[]; fails: boolean }

/** A draft the fact check accepts at once: the agent never revises it. */
const ACCEPTED: Attempt = { stages: ['drafting', 'verifying', 'saving'], fails: false }
/** A draft the fact check rejects once: revised, then checked again. */
const REVISED: Attempt = {
  stages: ['drafting', 'verifying', 'revising', 'verifying', 'saving'],
  fails: false,
}
/** The AI service gives up while drafting. */
const FAILED: Attempt = { stages: ['drafting'], fails: true }

/** The attempts of each scenario, in the order the worker runs them (as the API's worker does). */
const PLANS: Record<Scenario, Attempt[]> = {
  ready: [ACCEPTED],
  questions: [REVISED],
  retry: [FAILED, REVISED],
  fail: [FAILED, FAILED, FAILED],
}

/** The wait after the failed attempt `index + 1`; it doubles each time, as BullMQ's does. */
const backoffAfter = (index: number) => WORKER_TIMING.backoff * 2 ** index

type Phase =
  | {
      status: Extract<CvStatus, 'generating' | 'retrying'>
      stage: GenerationStage | null
      attempt: number
    }
  | { status: 'failed' }
  | { status: 'done' }

/** Where a job is `t` ms after the worker took it; with `t` past its end, how it ended. */
function phaseAt(t: number, scenario: Scenario): Phase {
  const { stage } = WORKER_TIMING
  const plan = PLANS[scenario]
  let start = 0
  for (const [index, attempt] of plan.entries()) {
    const running = t - start
    if (running < attempt.stages.length * stage) {
      return {
        status: 'generating',
        stage: attempt.stages[Math.floor(running / stage)]!,
        attempt: index + 1,
      }
    }
    start += attempt.stages.length * stage
    if (!attempt.fails) return { status: 'done' }
    if (index === plan.length - 1) return { status: 'failed' }
    const wait = backoffAfter(index)
    if (t - start < wait) return { status: 'retrying', stage: null, attempt: index + 1 }
    start += wait
  }
  return { status: 'failed' }
}

/** How long the worker is busy with a job of this scenario: its attempts and the waits between. */
function duration(scenario: Scenario): number {
  const plan = PLANS[scenario]
  return plan.reduce(
    (total, attempt, index) =>
      total +
      attempt.stages.length * WORKER_TIMING.stage +
      (index < plan.length - 1 ? backoffAfter(index) : 0),
    0,
  )
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
    const draft = generatedDraft({
      withQuestions: job.scenario !== 'ready',
      language: entry.cv.language,
    })
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
