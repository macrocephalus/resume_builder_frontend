import {
  computeMatch,
  cvStatusInfoSchema,
  cvStatusesQuerySchema,
  type Cv,
  type CvSummary,
} from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { errorResponse, validationError } from '@/mocks/respond'
import { readDb, updateDb } from '@/mocks/store'

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

/** The session user's own CVs; another user's CV does not exist for them. */
function ownCvs(userId: string): Cv[] {
  return readDb()
    .cvs.filter((entry) => entry.ownerId === userId)
    .map((entry) => entry.cv)
}

const byNewest = (a: Cv, b: Cv) => b.updatedAt.localeCompare(a.updatedAt)

export const cvHandlers = [
  http.get('/api/cvs', () => {
    const user = sessionUser()
    if (!user) return unauthorized()
    return HttpResponse.json({ items: ownCvs(user.id).sort(byNewest).map(toSummary) })
  }),

  http.get('/api/cvs/statuses', ({ request }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const query = cvStatusesQuerySchema.safeParse({
      ids: new URL(request.url).searchParams.get('ids') ?? '',
    })
    if (!query.success) return validationError(query.error)
    const items = ownCvs(user.id)
      .filter((cv) => query.data.ids.includes(cv.id))
      // The light part only: the schema strips everything else.
      .map((cv) => cvStatusInfoSchema.parse(cv))
    return HttpResponse.json({ items })
  }),

  http.get('/api/cvs/:id', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const cv = ownCvs(user.id).find((own) => own.id === params.id)
    return cv ? HttpResponse.json({ cv }) : notFound()
  }),

  http.delete('/api/cvs/:id', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const deleted = updateDb((db) => {
      const index = db.cvs.findIndex(
        (entry) => entry.ownerId === user.id && entry.cv.id === params.id,
      )
      if (index === -1) return false
      db.cvs.splice(index, 1)
      return true
    })
    return deleted ? new HttpResponse(null, { status: 204 }) : notFound()
  }),

  http.post('/api/cvs/:id/retry', ({ params }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const result = updateDb((db) => {
      const entry = db.cvs.find((own) => own.ownerId === user.id && own.cv.id === params.id)
      if (!entry) return 'missing' as const
      if (entry.cv.status !== 'failed') return 'invalid' as const
      entry.cv = {
        ...entry.cv,
        status: 'queued',
        attempt: 1,
        queuePosition: 1,
        errorCode: null,
        error: null,
        updatedAt: new Date().toISOString(),
      }
      return entry.cv
    })
    if (result === 'missing') return notFound()
    if (result === 'invalid')
      return errorResponse(409, 'INVALID_STATE', 'Only a failed CV can be retried.')
    return HttpResponse.json({ cv: result }, { status: 202 })
  }),
]
