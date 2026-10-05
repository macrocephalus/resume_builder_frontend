import {
  computeMatch,
  createCvBodySchema,
  cvStatusInfoSchema,
  cvStatusesQuerySchema,
  hasDraft,
  isInProgress,
  type Cv,
  type CvSummary,
} from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { buildCv } from '@/mocks/fixtures/cv'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { errorResponse, readJson, validationError } from '@/mocks/respond'
import { updateDb, type MockCv, type MockDb, type Scenario } from '@/mocks/store'
import { runWorker, scenarioFor } from '@/mocks/worker'

/** The limits of docs/api.md: CVs in progress at once, generations per hour. */
export const GENERATION_LIMITS = { active: 2, perHour: 10 }
const HOUR = 60 * 60 * 1000

const notFound = () => errorResponse(404, 'NOT_FOUND', 'This CV does not exist.')

function toSummary(cv: Cv): CvSummary {
  const match = cv.data ? computeMatch(cv.data, cv.requirements) : null
  return {
    id: cv.id,
    title: cv.title,
    targetRole: cv.targetRole,
    language: cv.language,
    status: cv.status,
    openQuestions: cv.questions.filter((question) => question.status === 'open').length,
    match: match ? { covered: match.covered, total: match.total } : null,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  }
}

/** The data after the fake worker has caught up with the clock. */
function currentDb(): MockDb {
  return updateDb((db) => {
    runWorker(db.cvs, Date.now())
    return db
  })
}

/** The session user's own CVs; another user's CV does not exist for them. */
const ownEntries = (db: MockDb, userId: string): MockCv[] =>
  db.cvs.filter((entry) => entry.ownerId === userId)

const byNewest = (a: Cv, b: Cv) => b.updatedAt.localeCompare(a.updatedAt)

/** Starting a generation (create or retry) counts toward both limits; `null` when it may start. */
function limitResponse(db: MockDb, userId: string, now: number) {
  const active = ownEntries(db, userId).filter((entry) => isInProgress(entry.cv.status)).length
  if (active >= GENERATION_LIMITS.active) {
    return errorResponse(429, 'TOO_MANY_ACTIVE', 'Two CVs are already being generated.', {
      details: { limit: GENERATION_LIMITS.active },
    })
  }
  const recent = (db.generations[userId] ?? []).filter((at) => now - at < HOUR)
  if (recent.length >= GENERATION_LIMITS.perHour) {
    const oldest = Math.min(...recent)
    return errorResponse(429, 'RATE_LIMITED', 'The hourly generation limit is reached.', {
      details: { limit: GENERATION_LIMITS.perHour },
      headers: { 'Retry-After': String(Math.ceil((oldest + HOUR - now) / 1000)) },
    })
  }
  return null
}

function countGeneration(db: MockDb, userId: string, now: number): void {
  db.generations[userId] = [...(db.generations[userId] ?? []).filter((at) => now - at < HOUR), now]
}

export const cvHandlers = [
  http.get('/api/cvs', () => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const items = ownEntries(currentDb(), user.id)
      .map((entry) => entry.cv)
      .sort(byNewest)
      .map(toSummary)
    return HttpResponse.json({ items })
  }),

  http.post('/api/cvs', async ({ request }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const body = createCvBodySchema.safeParse(await readJson(request))
    if (!body.success) return validationError(body.error)
    const { targetRole, roleContext, language, sourceType, sourceFilename, fromCvId } = body.data
    const now = Date.now()

    const result = updateDb((db) => {
      runWorker(db.cvs, now)
      if (fromCvId) {
        const parent = ownEntries(db, user.id).find((entry) => entry.cv.id === fromCvId)
        if (!parent) return notFound()
        if (!hasDraft(parent.cv.status)) {
          return errorResponse(409, 'INVALID_STATE', 'That CV has no draft to start from.')
        }
      }
      const limited = limitResponse(db, user.id, now)
      if (limited) return limited

      const cv = buildCv('queued', {
        title: targetRole,
        targetRole,
        roleContext: roleContext ?? null,
        language,
        sourceType,
        sourceFilename: sourceFilename ?? null,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      })
      const entry: MockCv = {
        ownerId: user.id,
        cv,
        job: { queuedAt: now, scenario: scenarioFor(targetRole) },
      }
      db.cvs.push(entry)
      countGeneration(db, user.id, now)
      runWorker(db.cvs, now)
      return entry.cv
    })
    return result instanceof Response ? result : HttpResponse.json({ cv: result }, { status: 202 })
  }),

  http.get('/api/cvs/statuses', ({ request }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const query = cvStatusesQuerySchema.safeParse({
      ids: new URL(request.url).searchParams.get('ids') ?? '',
    })
    if (!query.success) return validationError(query.error)
    const items = ownEntries(currentDb(), user.id)
      .filter((entry) => query.data.ids.includes(entry.cv.id))
      // The light part only: the schema strips everything else.
      .map((entry) => cvStatusInfoSchema.parse(entry.cv))
    return HttpResponse.json({ items })
  }),

  http.get('/api/cvs/:id', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const entry = ownEntries(currentDb(), user.id).find((own) => own.cv.id === params.id)
    return entry ? HttpResponse.json({ cv: entry.cv }) : notFound()
  }),

  http.delete('/api/cvs/:id', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const deleted = updateDb((db) => {
      const index = db.cvs.findIndex(
        (entry) => entry.ownerId === user.id && entry.cv.id === params.id,
      )
      if (index === -1) return false
      // A generation still running is dropped with it.
      db.cvs.splice(index, 1)
      return true
    })
    return deleted ? new HttpResponse(null, { status: 204 }) : notFound()
  }),

  http.post('/api/cvs/:id/retry', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const now = Date.now()
    const result = updateDb((db) => {
      runWorker(db.cvs, now)
      const entry = ownEntries(db, user.id).find((own) => own.cv.id === params.id)
      if (!entry) return notFound()
      if (entry.cv.status !== 'failed') {
        return errorResponse(409, 'INVALID_STATE', 'Only a failed CV can be retried.')
      }
      const limited = limitResponse(db, user.id, now)
      if (limited) return limited

      // A retried "fail" CV succeeds, so the demo shows recovery.
      const first = scenarioFor(entry.cv.targetRole)
      const scenario: Scenario = first === 'fail' ? 'questions' : first
      entry.cv = { ...entry.cv, attempt: 1, errorCode: null, error: null }
      entry.job = { queuedAt: now, scenario }
      countGeneration(db, user.id, now)
      runWorker(db.cvs, now)
      return entry.cv
    })
    return result instanceof Response ? result : HttpResponse.json({ cv: result }, { status: 202 })
  }),
]

/** For tests: the user has used up the hourly limit. */
export function exhaustHourlyLimit(userId: string, now = Date.now()): void {
  updateDb((db) => {
    db.generations[userId] = Array.from(
      { length: GENERATION_LIMITS.perHour },
      (_, i) => now - i * 1000,
    )
  })
}
